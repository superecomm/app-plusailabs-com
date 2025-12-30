"use client";

interface TypingIndicatorProps {
  displayName: string;
}

export function TypingIndicator({ displayName }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start my-2">
      <div className="max-w-xs px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {displayName} is typing
          </span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

