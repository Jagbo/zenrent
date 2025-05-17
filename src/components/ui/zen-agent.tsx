"use client";

import { useState, FormEvent } from "react";
import { Bot, Paperclip, Mic, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { AvatarFallback } from "@/components/ui/avatar";
import { ChatInput } from "@/components/ui/chat-input";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { toast } from "sonner";

interface Message {
  id: number;
  content: string;
  sender: "user" | "ai";
  error?: boolean;
  agentInfo?: {
    name: string;
    reasoning: string;
  };
}

export function ZenAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content:
        "Hello! I'm your ZenRent assistant. I can help you with property management, financial advice, and legal guidance. How can I assist you today?",
      sender: "ai",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      content: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: messages.length + 2,
        content: data.response,
        sender: "ai",
        agentInfo: data.agent,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: messages.length + 2,
        content:
          "I apologize, but I encountered an error processing your request. Please try again.",
        sender: "ai",
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttachFile = () => {
    // Implement file attachment logic
    toast.info("File attachment coming soon!");
  };

  const handleMicrophoneClick = () => {
    // Implement voice input logic
    toast.info("Voice input coming soon!");
  };

  return (
    <div>
      <ExpandableChat size="lg"
        position="bottom-right"
        icon={<Bot className="h-6 w-6" />}
      >
        <ExpandableChatHeader className="flex-col text-center justify-center bg-white px-4 py-3">
          <h1 className="text-xl font-cabinet-grotesk-bold">Speak to Zen ✨</h1>
          <p className="text-sm text-muted-foreground">
            Ask me anything about your properties
          </p>
        </ExpandableChatHeader>

        <ExpandableChatBody className="bg-gradient-to-br from-[#F7E9F1] via-[#FDEFED] to-[#E6F2F9] animate-gradient">
          <ChatMessageList>
            {messages.map((message) => (
              <ChatBubble key={message.id}
                variant={message.sender === "user" ? "sent" : "received"}
              >
                <ChatBubbleAvatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>
                    {message.sender === "user" ? "US" : "AI"}
                  </AvatarFallback>
                </ChatBubbleAvatar>
                <div className="flex flex-col gap-1">
                  {message.agentInfo && (
                    <span className="text-xs text-muted-foreground">
                      {message.agentInfo.name}
                    </span>
                  )}
                  <ChatBubbleMessage variant={message.sender === "user" ? "sent" : "received"}
                  >
                    {message.content}
                  </ChatBubbleMessage>
                </div>
              </ChatBubble>
            ))}

            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>AI</AvatarFallback>
                </ChatBubbleAvatar>
                <ChatBubbleMessage isLoading />
              </ChatBubble>
            )}
          </ChatMessageList>
        </ExpandableChatBody>

        <ExpandableChatFooter>
          <form onSubmit={handleSubmit}
            className="relative rounded-lg bg-white focus-within:ring-1 focus-within:ring-ring p-1"
          >
            <ChatInput value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="min-h-12 resize-none rounded-lg bg-white border-0 p-3 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center p-3 pt-0 justify-between">
              <div className="flex">
                <Button variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleAttachFile}
                >
                  <Paperclip className="size-4" />
                </Button>

                <Button variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleMicrophoneClick}
                >
                  <Mic className="size-4" />
                </Button>
              </div>
              <Button type="submit"
                size="sm"
                className="ml-auto gap-1.5 bg-[#D9E8FF] text-black hover:bg-[#C8D7EE]"
              >
                Send Message
                <CornerDownLeft className="size-3.5" />
              </Button>
            </div>
          </form>
        </ExpandableChatFooter>
      </ExpandableChat>
    </div>
  );
}
