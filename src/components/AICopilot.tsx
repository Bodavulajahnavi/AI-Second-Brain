import { useState, useRef, useEffect } from "react";
import { Note, Message } from "../types";
import { MessageSquare, Send, Sparkles, AlertCircle, Bot, User, Trash2 } from "lucide-react";

interface AICopilotProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (noteId: string) => void;
}

export default function AICopilot({ notes, selectedNote, onSelectNote }: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Hello! I am your integrated **Second Brain AI Assistant**. I have a complete live index of your local knowledge base notes. Ask me to synthesize your topics, suggest missing links, or summarize your research vaults!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Aggregate entire vault context for server-side RAG injection
  const getNotesContextString = () => {
    if (notes.length === 0) return "No notes added yet.";
    return notes
      .map(
        (note) => `---
TITLE: ${note.title}
TAGS: ${note.tags.join(", ")}
CONTENT:
${note.content}`
      )
      .join("\n\n");
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const notesContext = getNotesContextString();
      const updatedMessagesForApi = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessagesForApi,
          notesContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat assistant failed to respond. Check if your API key is configured.");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: data.content,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "initial",
        role: "assistant",
        content:
          "Chat history reset. I am ready to query your indexed vault notes again. What are we exploring today?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const suggestionPills = [
    { label: "🔗 Find connections", prompt: "Look at all my notes and suggest 3 hidden logical connections between them." },
    { label: "🧠 Summarize my brain", prompt: "Synthesize the main themes in my Second Brain notes and explain them in simple terms." },
    { label: "📋 Identify gaps", prompt: "What subjects are missing or weakly covered in my current notes? Recommend new topics to write." },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-[#141414] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-white/50" />
          <span className="text-xs font-mono font-medium text-white/40 tracking-[0.1em]">CLAUDE AI ASSISTANT</span>
        </div>
        <button
          onClick={handleClearChat}
          className="text-[10px] font-mono text-white/40 hover:text-red-400 flex items-center gap-1 transition cursor-pointer"
          id="btn-clear-chat"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Vault Chat
        </button>
      </div>

      {/* Selected Note Context Notification */}
      {selectedNote && (
        <div className="bg-white/5 border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-[11px]">
          <span className="text-white/80 font-mono truncate">
            Active Context: [[{selectedNote.title}]]
          </span>
          <button
            onClick={() => handleSendMessage(`Analyze my note [[${selectedNote.title}]] and tell me what its main takeaways are.`)}
            className="text-white hover:text-white/80 font-mono text-[10px] transition cursor-pointer"
          >
            Ask about this note
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-grow overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                  isUser
                    ? "bg-white/5 border-white/10 text-white/80"
                    : "bg-[#141414] border-white/10 text-white"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? "bg-white/10 text-white rounded-tr-none border border-white/15"
                    : "bg-[#141414]/90 text-white/80 rounded-tl-none border border-white/5"
                }`}
              >
                {/* Custom renderer for bracketed Obsidian links */}
                <div className="space-y-1.5 whitespace-pre-wrap">
                  {msg.content.split(/(\[\[.*?\]\])/g).map((part, index) => {
                    if (part.startsWith("[[") && part.endsWith("]]")) {
                      const linkTitle = part.slice(2, -2).trim();
                      const targetNote = notes.find(
                        (n) => n.title.toLowerCase().trim() === linkTitle.toLowerCase()
                      );
                      return targetNote ? (
                        <button
                          key={index}
                          onClick={() => onSelectNote(targetNote.id)}
                          className="text-white hover:text-white/80 font-semibold underline inline cursor-pointer"
                        >
                          {linkTitle}
                        </button>
                      ) : (
                        <span key={index} className="text-white/30 font-medium">
                          {linkTitle}
                        </span>
                      );
                    }
                    return <span key={index}>{part}</span>;
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border bg-[#141414] border-white/10 text-white">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#141414]/90 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl items-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion pills */}
      <div className="px-4 py-2 border-t border-white/10 flex flex-wrap gap-2 bg-[#0A0A0A]">
        {suggestionPills.map((pill) => (
          <button
            key={pill.label}
            onClick={() => handleSendMessage(pill.prompt)}
            className="text-[10px] font-mono border border-white/10 hover:border-white/20 text-white/60 hover:text-white bg-[#141414] hover:bg-white/5 px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            {pill.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-[#141414]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about your Second Brain..."
            className="flex-grow bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition disabled:opacity-50 font-sans"
            id="chat-input-field"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-white hover:bg-white/90 disabled:bg-white/5 disabled:text-white/20 text-black px-4 py-2.5 rounded-xl font-bold transition flex items-center justify-center cursor-pointer shrink-0"
            id="chat-submit-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
