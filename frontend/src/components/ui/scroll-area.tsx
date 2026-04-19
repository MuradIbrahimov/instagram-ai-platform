import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const scrollAreaVariants = cva("relative overflow-auto");

export const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(scrollAreaVariants(), className)} {...props} />,
);
ScrollArea.displayName = "ScrollArea";
