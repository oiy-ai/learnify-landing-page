"use client";

import React, { useState } from "react";
import { useChat } from "@ai-sdk/react";
import Markdown from "react-markdown";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";
import { SendIcon, BotIcon, UserIcon } from "lucide-react";

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_URL!.replace(
  /.cloud$/,
  ".site"
);

export function AIConfig() {
  // AI Configuration States
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful customer service assistant. Answer questions politely and professionally."
  );
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(150);
  const [model, setModel] = useState("gpt-3.5-turbo");
  const [enableGreeting, setEnableGreeting] = useState(true);
  const [greetingMessage, setGreetingMessage] = useState(
    "Hello! How can I help you today?"
  );

  // Chat functionality
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } =
    useChat({
      maxSteps: 10,
      api: `${CONVEX_SITE_URL}/api/chat`,
      initialMessages: enableGreeting ? [
        {
          id: "greeting",
          role: "assistant",
          content: greetingMessage,
          createdAt: new Date(),
        }
      ] : [],
      body: {
        systemPrompt,
        temperature: temperature,
        maxTokens: maxTokens,
        model,
      },
    });

  const handleConfigSave = () => {
    // Reset chat with new greeting if enabled
    if (enableGreeting) {
      setMessages([{
        id: "greeting",
        role: "assistant",
        content: greetingMessage,
        createdAt: new Date(),
      }]);
    } else {
      setMessages([]);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BotIcon className="w-5 h-5" />
          AI Customer Service Configuration
        </CardTitle>
        <CardDescription>
          Configure and test your AI customer service assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col border rounded-lg p-4 bg-neutral-50 dark:bg-neutral-900">
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "flex gap-3 max-w-[80%]",
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          message.role === "user" 
                            ? "bg-blue-100 dark:bg-blue-900" 
                            : "bg-purple-100 dark:bg-purple-900"
                        )}>
                          {message.role === "user" ? (
                            <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <BotIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                        <div
                          className={cn(
                            "px-4 py-2 rounded-lg",
                            message.role === "user"
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                          )}
                        >
                          <div className="prose-sm prose-p:my-0.5 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 dark:prose-invert">
                            <Markdown>{message.content}</Markdown>
                          </div>
                        </div>
                      </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <BotIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </div>
                      </div>
                    </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type a message to test your AI..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading} size="icon">
                  <SendIcon className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
      </CardContent>
    </Card>
  );
}