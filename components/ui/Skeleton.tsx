export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded ${className}`} 
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
      <Skeleton className="h-6 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-32 h-32",
  };
  
  return <Skeleton className={`${sizeClasses[size]} rounded-full`} />;
}

