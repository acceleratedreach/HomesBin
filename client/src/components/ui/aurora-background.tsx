"use client";

import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

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
  return (
    <div 
      className={cn(
        "relative h-full flex flex-col items-center justify-center overflow-hidden antialiased [perspective:1000px] [transform-style:preserve-3d]",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Aurora gradient elements */}
        <div
          className="absolute left-[calc(50%-20rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[80rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
        <div 
          className="absolute -top-40 right-[calc(50%-11rem)] aspect-[1155/678] w-[80rem] translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:right-[calc(50%-30rem)]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
      
      {/* Soft radial gradient to enhance content visibility */}
      {showRadialGradient && (
        <div 
          className="absolute inset-0 z-0 bg-gradient-radial from-transparent via-transparent to-white dark:to-black"
          style={{ opacity: 0.8 }}
        />
      )}

      {/* Content positioned on top of gradients */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};