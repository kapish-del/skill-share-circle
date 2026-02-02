import { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useConversations, useMessages } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, loading: convosLoading } = useConversations();
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConvo = conversations.find((c) => c.id === selectedConvoId);
  const { messages, loading: messagesLoading, sendMessage } = useMessages(selectedConvoId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage("");
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), "h:mm a");
  };

  // Chat view when conversation is selected
  if (selectedConvoId && selectedConvo) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Chat header */}
        <div className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setSelectedConvoId(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedConvo.other_user?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {selectedConvo.other_user?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">
                {selectedConvo.other_user?.name || "Unknown"}
              </h2>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messagesLoading ? (
            <p className="text-center text-muted-foreground">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border/50 rounded-bl-md"
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {formatMessageTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="sticky bottom-0 glass border-t border-border/50 p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 h-11 rounded-full bg-secondary border-border/50"
            />
            <Button
              size="icon"
              className="h-11 w-11 rounded-full"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation list view
  return (
    <AppLayout title="Messages">
      <div className="px-4 py-6 space-y-4">
        {/* Search */}
        <div className="relative animate-fade-in">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-12 h-11 rounded-2xl bg-secondary border-border/50 focus:border-primary"
          />
        </div>

        {/* Pro Tip */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary text-lg">💡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Pro Tip</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Agree on a specific topic before booking to make sessions more productive!
              </p>
            </div>
          </div>
        </div>

        {/* Conversation list */}
        <div className="space-y-1">
          {convosLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No conversations yet</p>
              <Button
                variant="link"
                className="text-primary p-0 h-auto mt-2"
                onClick={() => navigate("/search")}
              >
                Find tutors to connect with →
              </Button>
            </div>
          ) : (
            conversations.map((convo, i) => (
              <div
                key={convo.id}
                onClick={() => setSelectedConvoId(convo.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl",
                  "transition-all duration-200 hover:bg-secondary cursor-pointer",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${0.15 + i * 0.05}s` }}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={convo.other_user?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {convo.other_user?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">
                      {convo.other_user?.name || "Unknown"}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {convo.last_message ? formatTime(convo.last_message.created_at) : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {convo.last_message?.content || "No messages yet"}
                  </p>
                </div>

                {convo.unread_count > 0 && (
                  <div className="h-5 min-w-[20px] rounded-full bg-primary flex items-center justify-center px-1.5">
                    <span className="text-xs font-semibold text-primary-foreground">
                      {convo.unread_count}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
