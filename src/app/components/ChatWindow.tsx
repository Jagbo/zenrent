"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";

interface Message {
  id: string;
  from: "user" | "business";
  text: string;
  timestamp: string;
  status?: string;
}

interface ChatWindowProps {
  tenantName: string;
  tenantPhone: string;
  tenantImage?: string;
  onSendMessage: (message: string) => Promise<void>;
  messages: Message[];
  isWhatsAppConnected: boolean;
  isLoadingMessages: boolean;
}

// Helper to create placeholder image URLs from name
const getInitialsAvatar = (name: string) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;
};

export function ChatWindow({
  tenantName,
  tenantPhone,
  tenantImage,
  onSendMessage,
  messages,
  isWhatsAppConnected,
  isLoadingMessages,
}: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !isWhatsAppConnected) return;

    setIsSending(true);
    try {
      await onSendMessage(messageInput);
      setMessageInput("");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp for display
  const formatMessageTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, h:mm a");
    } catch (error) {
      return ""; // Return empty string if date is invalid
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden border border-gray-200 rounded-lg bg-white">
      {/* Chat header */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Image src={tenantImage || getInitialsAvatar(tenantName)}
            alt={tenantName}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <h3 className="text-base font-medium text-gray-900">
              {tenantName}
            </h3>
            <p className="text-sm text-gray-500">{tenantPhone}</p>
          </div>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {isLoadingMessages && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700"></div>
          </div>
        )}

        {!isLoadingMessages && messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id}
              className={`flex ${message.from === "business" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.from === "business"
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                    message.from === "business"
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {formatMessageTime(message.timestamp)}
                  {message.from === "business" && message.status && (
                    <span className="ml-2">
                      •{" "}
                      {message.status === "sent"
                        ? "Sent"
                        : message.status === "delivered"
                          ? "Delivered"
                          : message.status === "read"
                            ? "Read"
                            : message.status}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      {isWhatsAppConnected ? (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <textarea value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSending}
            />
            <button onClick={handleSendMessage}
              disabled={!messageInput.trim() || isSending}
              className="p-2 rounded-full bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-center text-gray-500">
            Connect WhatsApp to send messages
          </p>
        </div>
      )}
    </div>
  );
}
