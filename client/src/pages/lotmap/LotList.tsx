import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";

interface LotListProps {
  lots: any[];
  onEdit: (lot: any) => void;
  onDelete: (lotId: number) => void;
}

export default function LotList({ lots = [], onEdit, onDelete }: LotListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredLots = lots.filter(lot => 
    lot.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'sold':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search lots..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {filteredLots.length} {filteredLots.length === 1 ? 'lot' : 'lots'}
        </div>
      </div>
      
      {filteredLots.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Size (sqft)</TableHead>
                <TableHead>Beds / Baths</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-medium">{lot.number}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lot.status)}>
                      {lot.status?.charAt(0).toUpperCase() + lot.status?.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{lot.price ? formatCurrency(lot.price) : '-'}</TableCell>
                  <TableCell>{lot.sqft ? `${lot.sqft.toLocaleString()} sqft` : '-'}</TableCell>
                  <TableCell>
                    {lot.bedrooms || lot.bathrooms ? 
                      `${lot.bedrooms || 0} bd / ${lot.bathrooms || 0} ba` : 
                      '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(lot)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600" 
                          onClick={() => onDelete(lot.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <p className="text-muted-foreground">No lots found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
} 