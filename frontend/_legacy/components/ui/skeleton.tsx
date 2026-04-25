import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva("animate-pulse rounded-md bg-muted/70", {
  variants: {
    variant: {
      default: "",
      shimmer: "bg-gradient-to-r from-muted via-muted/70 to-muted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, variant, ...props }: SkeletonProps): React.JSX.Element {
  return <div className={cn(skeletonVariants({ variant }), className)} {...props} />;
}
