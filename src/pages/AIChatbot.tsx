import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    initializeSession();
    fetchChatHistory();
  }, []);

  // 🔹 Ensure user is authenticated
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate("/auth");
  };

  // 🔹 Create or retrieve a persistent session ID for the logged-in user
  const initializeSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Try loading session ID from localStorage
    const storedSession = localStorage.getItem(`session_${user.id}`);
    if (storedSession) {
      setSessionId(storedSession);
      return;
    }

    // Otherwise generate a new one and save it
    const newSessionId = `session-${user.id}-${Date.now()}`;
    localStorage.setItem(`session_${user.id}`, newSessionId);
    setSessionId(newSessionId);
  };

  // 🔹 Load chat history from Supabase
  const fetchChatHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(10);

      if (data) {
        const formattedMessages: Message[] = [];
        data.forEach((msg) => {
          formattedMessages.push(
            { role: "user", content: msg.message },
            { role: "assistant", content: msg.response }
          );
        });
        setMessages(formattedMessages);
      }
    }
  };

  // 🔹 Handle sending a message
  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // 🔹 Send message + session_id to API
      const response = await fetch("https://conversationalllmsapi.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId, // required by your API
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // 🔹 Extract the correct AI response field
      const aiResponse =
        data.response || data.reply || data.output || data.message || "No response received from AI.";

      // 🔹 Append the AI response to messages
      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);

      // 🔹 Save chat in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("chat_messages").insert({
          user_id: user.id,
          message: userMessage,
          response: aiResponse,
        });
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong while connecting to AI.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">AI Fitness Assistant</h1>
        
        <Card className="h-[calc(100vh-250px)] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Chat with AI Coach
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Ask me anything about fitness, health, or nutrition!
                    </p>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="bg-primary/10 p-2 rounded-full h-fit">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <div className="bg-primary/10 p-2 rounded-full h-fit">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="bg-primary/10 p-2 rounded-full h-fit">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about workouts, nutrition, or health..."
                  disabled={loading}
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIChatbot;