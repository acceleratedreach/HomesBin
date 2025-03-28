"use client";

import { cn } from "@/lib/utils";
import React, { ReactNode, useEffect, useState } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: ReactNode;
  showRadialGradient?: boolean;
  className?: string;
}

export const AuroraBackground = ({
  children,
  showRadialGradient = true,
  className,
  ...props
}: AuroraBackgroundProps) => {
  // Use state to force higher z-index blur on first render for visual effect
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div 
      className={cn(
        "relative h-full w-full flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-black",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Primary aurora gradient */}
        <div className="absolute inset-x-0 top-0 h-[500px] w-full">
          <div 
            className="absolute h-full w-full rotate-[35deg] scale-x-150 bg-gradient-to-r from-[#4f56ff] via-[#ff4980] to-[#4f56ff] opacity-40 blur-[80px] dark:opacity-30 animate-aurora"
            style={{ 
              backgroundSize: "200% 100%",
              transformOrigin: "center center",
            }}
          />
        </div>
        
        {/* Secondary aurora gradient with offset timing */}
        <div className="absolute inset-x-0 top-[200px] h-[600px] w-full">
          <div 
            className="absolute h-full w-full -rotate-[40deg] scale-x-150 bg-gradient-to-r from-[#cb5eee] via-[#4be1ec] to-[#cb5eee] opacity-30 blur-[80px] dark:opacity-20 animate-aurora"
            style={{ 
              backgroundSize: "200% 100%",
              transformOrigin: "center center",
              animationDelay: "-10s",
            }}
          />
        </div>
        
        {/* Tertiary aurora gradient */}
        <div className="absolute bottom-0 inset-x-0 h-[500px] w-full">
          <div 
            className="absolute h-full w-full rotate-[15deg] scale-x-150 bg-gradient-to-r from-[#ff6b6b] via-[#4899f4] to-[#ff6b6b] opacity-25 blur-[80px] dark:opacity-20 animate-aurora"
            style={{ 
              backgroundSize: "200% 100%",
              transformOrigin: "center center",
              animationDelay: "-5s",
            }}
          />
        </div>
      </div>
      
      {/* Soft radial gradient to enhance content visibility */}
      {showRadialGradient && (
        <div 
          className="absolute inset-0 z-0 bg-gradient-radial from-transparent via-transparent to-white dark:to-black"
          style={{ opacity: 0.85 }}
        />
      )}

      {/* Content positioned on top of gradients */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};