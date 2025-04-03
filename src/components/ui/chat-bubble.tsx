"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received";
}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant = "received", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-max max-w-[80%] items-start gap-2 p-2",
          variant === "sent" ? "ml-auto" : "mr-auto",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ChatBubble.displayName = "ChatBubble";

interface ChatBubbleAvatarProps extends React.ComponentProps<typeof Avatar> {}

const ChatBubbleAvatar = React.forwardRef<
  React.ElementRef<typeof Avatar>,
  ChatBubbleAvatarProps
>(({ className, ...props }, ref) => (
  <Avatar ref={ref} className={cn("h-8 w-8", className)} {...props} />
));
ChatBubbleAvatar.displayName = "ChatBubbleAvatar";

interface ChatBubbleMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received";
  isLoading?: boolean;
}

const ChatBubbleMessage = React.forwardRef<
  HTMLDivElement,
  ChatBubbleMessageProps
>(({ className, variant = "received", isLoading, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl px-4 py-2 max-w-sm",
        variant === "sent"
          ? "bg-primary text-primary-foreground"
          : "bg-muted",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <div className="flex gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-current" />
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-current"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-current"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      ) : (
        children
      )}
    </div>
  );
});
ChatBubbleMessage.displayName = "ChatBubbleMessage";

export { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage }; 