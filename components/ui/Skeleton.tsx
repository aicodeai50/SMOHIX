import { type HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** When true, uses a fixed height block; otherwise fills parent. */
  block?: boolean;
};

export function Skeleton({ className = "", block = true, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className={`zentro-skeleton rounded-lg ${block ? "min-h-[1rem]" : ""} ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="Loading content">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-4/5" : "w-full"}`}
          aria-hidden={i > 0}
        />
      ))}
    </div>
  );
}
