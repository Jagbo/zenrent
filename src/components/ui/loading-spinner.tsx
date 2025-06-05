import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

export function LoadingSpinner({ 
  size = "md", 
  className,
  label = "Loading..."
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-gray-300 border-t-gray-900",
          sizeClasses[size]
        )}
        role="status"
        aria-label={label}
      />
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  show: boolean;
  label?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({ 
  show, 
  label = "Loading...",
  fullScreen = false 
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-white/80 backdrop-blur-sm z-50",
        fullScreen ? "fixed inset-0" : "absolute inset-0"
      )}
    >
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  );
} 