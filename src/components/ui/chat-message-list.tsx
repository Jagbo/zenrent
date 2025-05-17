"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, ...props }, ref) => {
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [children]);

    return (
      <div ref={ref}
        className={cn("flex flex-col gap-4 p-4", className)}
        {...props}
      >
        {children}
        <div ref={messagesEndRef} />
      </div>
    );
  },
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList };
