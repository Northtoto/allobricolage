/**
 * 💬 AI Chat Assistant Component
 * 
 * 24/7 AI support that understands context, answers questions,
 * creates bookings, and tracks status.
 * Supports Darija, French, and Arabic.
 */

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Bot, User, Sparkles, MapPin, CreditCard, Calendar } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  functionCalled?: string;
  functionResult?: any;
  suggestedActions?: string[];
  timestamp: Date;
}

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Bonjour! Je suis l'assistant AI d'AlloBricolage. Comment puis-je vous aider aujourd'hui?\n\nVous pouvez me demander:\n• De réserver un technicien\n• Le prix d'un service\n• Le statut de votre réservation\n• Où est votre technicien",
      suggestedActions: [
        "Réserver un plombier",
        "Combien coûte un électricien?",
        "Mes réservations"
      ],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message,
          history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.message,
        functionCalled: data.functionCalled,
        functionResult: data.functionResult,
        suggestedActions: data.suggestedActions,
        timestamp: new Date()
      }]);
    },
    onError: () => {
      toast({
        title: "❌ Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    }
  });

  const sendMessage = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(input.trim());
    setInput("");
  };

  const handleSuggestedAction = (action: string) => {
    setInput(action);
    // Auto-send after a short delay
    setTimeout(() => {
      const userMessage: Message = {
        role: "user",
        content: action,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      chatMutation.mutate(action);
      setInput("");
    }, 100);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getFunctionIcon = (functionName?: string) => {
    switch (functionName) {
      case "create_booking": return <Calendar className="h-4 w-4" />;
      case "track_technician": return <MapPin className="h-4 w-4" />;
      case "send_payment_link": return <CreditCard className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Assistant AlloBricolage
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">🤖 AI</Badge>
          <Badge variant="outline" className="text-xs">🇫🇷 FR</Badge>
          <Badge variant="outline" className="text-xs">🇲🇦 Darija</Badge>
          <span className="text-xs">• Disponible 24/7</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/logo.png" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Function Result Badge */}
                  {msg.functionCalled && (
                    <Badge variant="secondary" className="mt-2">
                      {getFunctionIcon(msg.functionCalled)}
                      <span className="ml-1">{msg.functionCalled.replace(/_/g, " ")}</span>
                    </Badge>
                  )}

                  {/* Suggested Actions */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.suggestedActions.map((action, j) => (
                        <Button
                          key={j}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestedAction(action)}
                          className="text-xs"
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  )}

                  <span className="text-xs text-muted-foreground mt-1 block">
                    {msg.timestamp.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>

                {msg.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t">
        <div className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Tapez votre message..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || chatMutation.isPending}
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

