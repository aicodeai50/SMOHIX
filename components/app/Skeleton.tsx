import type { ComponentProps } from "react";

type DivProps = ComponentProps<"div">;

const base = "animate-pulse rounded-md bg-white/[0.07]";

/** Shimmer-style block; parent should use `animate-pulse` or pass `className` to combine. */
export function Skeleton({ className, ...rest }: DivProps) {
  return <div className={`${base} ${className ?? ""}`} {...rest} />;
}

export function SkeletonText({ className, ...rest }: DivProps) {
  return <Skeleton className={`h-3 ${className ?? ""}`} {...rest} />;
}
