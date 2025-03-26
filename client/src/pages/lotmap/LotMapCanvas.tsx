import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { MousePointer, Square, Hand, Move, Trash2, PenTool } from "lucide-react";

interface LotMapCanvasProps {
  mapData: any;
  lots: any[];
  onSelectLot: (lot: any) => void;
  onUpdateLot: (lot: any) => void;
  onCreateLot: (newLot: any) => void;
}

interface Point {
  x: number;
  y: number;
}

interface DrawingState {
  isDrawing: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  selectedLot: any | null;
  pathPoints: Point[];
}

export default function LotMapCanvas({
  mapData,
  lots = [],
  onSelectLot,
  onUpdateLot,
  onCreateLot
}: LotMapCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [tool, setTool] = useState<"select" | "rect" | "pan" | "move" | "delete" | "path">("select");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
    selectedLot: null,
    pathPoints: []
  });

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = (point: Point): Point => {
    return {
      x: (point.x - offset.x) / scale,
      y: (point.y - offset.y) / scale
    };
  };

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = (point: Point): Point => {
    return {
      x: point.x * scale + offset.x,
      y: point.y * scale + offset.y
    };
  };

  // Handle mouse events for drawing and interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const point = screenToCanvas({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    switch (tool) {
      case "rect":
        setDrawingState({
          isDrawing: true,
          startPoint: point,
          currentPoint: point,
          selectedLot: null,
          pathPoints: []
        });
        break;
      case "path":
        setDrawingState(prev => ({
          ...prev,
          isDrawing: true,
          pathPoints: [...prev.pathPoints, point]
        }));
        break;
      case "select":
        // Find clicked lot
        const clickedLot = lots.find(lot => {
          const lotRect = {
            left: lot.x,
            top: lot.y,
            right: lot.x + lot.width,
            bottom: lot.y + lot.height
          };
          return point.x >= lotRect.left && point.x <= lotRect.right &&
                 point.y >= lotRect.top && point.y <= lotRect.bottom;
        });
        
        if (clickedLot) {
          setDrawingState(prev => ({
            ...prev,
            selectedLot: clickedLot
          }));
          onSelectLot(clickedLot);
        }
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || !drawingState.isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const point = screenToCanvas({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    switch (tool) {
      case "rect":
        setDrawingState(prev => ({
          ...prev,
          currentPoint: point
        }));
        break;
      case "path":
        setDrawingState(prev => ({
          ...prev,
          pathPoints: [...prev.pathPoints, point]
        }));
        break;
    }
  };

  const handleMouseUp = () => {
    if (!drawingState.isDrawing) return;

    switch (tool) {
      case "rect":
        if (drawingState.startPoint && drawingState.currentPoint) {
          const width = Math.abs(drawingState.currentPoint.x - drawingState.startPoint.x);
          const height = Math.abs(drawingState.currentPoint.y - drawingState.startPoint.y);
          
          if (width > 10 && height > 10) {
            const newLot = {
              number: `Lot ${lots.length + 1}`,
              x: Math.min(drawingState.startPoint.x, drawingState.currentPoint.x),
              y: Math.min(drawingState.startPoint.y, drawingState.currentPoint.y),
              width,
              height,
              svgPath: `M ${drawingState.startPoint.x} ${drawingState.startPoint.y} 
                       L ${drawingState.currentPoint.x} ${drawingState.startPoint.y} 
                       L ${drawingState.currentPoint.x} ${drawingState.currentPoint.y} 
                       L ${drawingState.startPoint.x} ${drawingState.currentPoint.y} Z`
            };
            onCreateLot(newLot);
          }
        }
        break;
      case "path":
        if (drawingState.pathPoints.length > 2) {
          const svgPath = `M ${drawingState.pathPoints.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
          const newLot = {
            number: `Lot ${lots.length + 1}`,
            svgPath,
            // Calculate bounding box for the path
            x: Math.min(...drawingState.pathPoints.map(p => p.x)),
            y: Math.min(...drawingState.pathPoints.map(p => p.y)),
            width: Math.max(...drawingState.pathPoints.map(p => p.x)) - Math.min(...drawingState.pathPoints.map(p => p.x)),
            height: Math.max(...drawingState.pathPoints.map(p => p.y)) - Math.min(...drawingState.pathPoints.map(p => p.y))
          };
          onCreateLot(newLot);
        }
        break;
    }

    setDrawingState({
      isDrawing: false,
      startPoint: null,
      currentPoint: null,
      selectedLot: null,
      pathPoints: []
    });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleToolSelect = (selectedTool: typeof tool) => {
    setTool(selectedTool);
    setDrawingState({
      isDrawing: false,
      startPoint: null,
      currentPoint: null,
      selectedLot: null,
      pathPoints: []
    });
  };

  // Render drawing preview
  const renderDrawingPreview = () => {
    if (!drawingState.isDrawing) return null;

    switch (tool) {
      case "rect":
        if (drawingState.startPoint && drawingState.currentPoint) {
          const width = Math.abs(drawingState.currentPoint.x - drawingState.startPoint.x);
          const height = Math.abs(drawingState.currentPoint.y - drawingState.startPoint.y);
          const x = Math.min(drawingState.startPoint.x, drawingState.currentPoint.x);
          const y = Math.min(drawingState.startPoint.y, drawingState.currentPoint.y);

          return (
            <div
              className="absolute border-2 border-dashed border-blue-500 bg-blue-100 bg-opacity-30"
              style={{
                left: x,
                top: y,
                width,
                height
              }}
            />
          );
        }
        break;
      case "path":
        if (drawingState.pathPoints.length > 0) {
          const points = drawingState.pathPoints.map(p => `${p.x} ${p.y}`).join(' ');
          return (
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
            >
              <path
                d={`M ${points}`}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>
          );
        }
        break;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between mb-3 border-b pb-3">
        <div className="flex gap-1">
          <Button
            variant={tool === "select" ? "default" : "outline"}
            size="icon"
            onClick={() => handleToolSelect("select")}
            title="Select Tool"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "rect" ? "default" : "outline"}
            size="icon"
            onClick={() => handleToolSelect("rect")}
            title="Rectangle Tool"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "path" ? "default" : "outline"}
            size="icon"
            onClick={() => handleToolSelect("path")}
            title="Path Tool"
          >
            <PenTool className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "pan" ? "default" : "outline"}
            size="icon"
            onClick={() => handleToolSelect("pan")}
            title="Pan Tool"
          >
            <Hand className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "move" ? "default" : "outline"}
            size="icon"
            onClick={() => handleToolSelect("move")}
            title="Move Tool"
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "delete" ? "default" : "outline"}
            size="icon"
            onClick={() => handleToolSelect("delete")}
            title="Delete Tool"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            -
          </Button>
          <div className="flex items-center px-2 text-sm">
            {Math.round(scale * 100)}%
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            +
          </Button>
        </div>
      </div>
      
      <div 
        ref={canvasRef}
        className="flex-grow relative border rounded-md bg-white overflow-hidden"
        style={{ 
          backgroundSize: '20px 20px', 
          backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          transition: 'transform 0.2s ease-out'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {mapData?.backgroundImage && (
          <img 
            src={mapData.backgroundImage} 
            alt="Map Background" 
            className="absolute inset-0 w-full h-full object-contain opacity-50"
          />
        )}
        
        {/* Render lots */}
        {lots.map((lot) => (
          <div
            key={lot.id}
            className={`absolute border-2 ${
              drawingState.selectedLot?.id === lot.id
                ? 'border-blue-700 bg-blue-200'
                : 'border-blue-500 bg-blue-100'
            } bg-opacity-50 cursor-pointer`}
            style={{
              left: lot.x || 0,
              top: lot.y || 0,
              width: lot.width || 100,
              height: lot.height || 100,
              backgroundColor: lot.color || 'rgba(59, 130, 246, 0.2)',
              borderColor: lot.color || 'rgb(59, 130, 246)'
            }}
            onClick={() => onSelectLot(lot)}
          >
            <div className="p-2 text-xs font-medium">
              {lot.number}
            </div>
            {lot.svgPath && (
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${lot.width} ${lot.height}`}
              >
                <path
                  d={lot.svgPath}
                  fill="none"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="2"
                />
              </svg>
            )}
          </div>
        ))}
        
        {/* Render drawing preview */}
        {renderDrawingPreview()}
        
        {lots.length === 0 && !drawingState.isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center p-6">
              <p>No properties defined yet</p>
              <p className="text-sm">Use the rectangle or path tool to create lots on this map</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 