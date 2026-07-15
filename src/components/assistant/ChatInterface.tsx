"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, MicOff, Loader2, RefreshCw, Languages, Bot, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageUtils";
import { uploadChatReceiptAction } from "@/actions/chat";

type Language = "hinglish" | "hindi" | "english";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  quickReplies?: string[];
  expenseSummary?: Record<string, unknown> | null;
  isExpenseSaved?: boolean;
}

interface ChatInterfaceProps {
  initialGreeting: string;
  dailyMotivation: string;
  userName: string;
  userId: string;
}

const QUICK_ACTIONS: Record<Language, { label: string; value: string; primary?: boolean }[]> = {
  hinglish: [
    { label: "+ Naya Kharcha", value: "Naya kharcha jodna hai", primary: true },
    { label: "📊 Aaj Ka Kharcha", value: "Aaj kitna kharcha hua?" },
    { label: "📈 Is Mahine Ka Total", value: "Is mahine ka total kharcha batao" },
    { label: "🕐 Recent Kharche", value: "Recent kharche dikhao" },
  ],
  hindi: [
    { label: "+ नया खर्चा", value: "नया खर्चा जोड़ना है", primary: true },
    { label: "📊 आज का खर्चा", value: "आज कितना खर्चा हुआ?" },
    { label: "📈 इस महीने का टोटल", value: "इस महीने का कुल खर्चा बताओ" },
    { label: "🕐 हाल के खर्चे", value: "हाल के खर्चे दिखाओ" },
  ],
  english: [
    { label: "+ Add Expense", value: "I want to add a new expense", primary: true },
    { label: "📊 Today's Expenses", value: "How much did we spend today?" },
    { label: "📈 This Month's Total", value: "Show this month's total spending" },
    { label: "🕐 Recent Expenses", value: "Show recent expenses" },
  ],
};

const LANG_LABELS: Record<Language, string> = {
  hinglish: "HI/EN",
  hindi: "हिंदी",
  english: "EN",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class='bg-black/10 rounded px-1 text-xs'>$1</code>")
    .replace(/\n/g, "<br/>");
}

export function ChatInterface({ initialGreeting, dailyMotivation, userName }: ChatInterfaceProps) {
  const [language, setLanguage] = useState<Language>("hinglish");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [usedReplies, setUsedReplies] = useState<Set<string>>(new Set());
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize greeting message
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `${initialGreeting}\n\n_${dailyMotivation}_\n\nAaj main aapki kis tarah madad karun?`,
        timestamp: new Date(),
      },
    ]);
  }, [initialGreeting, dailyMotivation]);

  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      setSpeechSupported(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: Message = {
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      try {
        const response = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            conversationId,
            history,
            language,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errMsg = data.message || data.error || "Kuch problem aayi. Dobara try karein. 🙏";
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: errMsg, timestamp: new Date() },
          ]);
          return;
        }

        if (data.conversationId) setConversationId(data.conversationId);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
            quickReplies: data.quickReplies || [],
            expenseSummary: data.expenseSummary || null,
            isExpenseSaved: data.isExpenseSaved || false,
          },
        ]);

        if (data.isExpenseSaved) toast.success("Kharcha successfully save ho gaya! ✅");
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Network problem. Please internet check karein aur dobara try karein. 🙏",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [messages, conversationId, isLoading, language]
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info("Image compress aur upload ho rahi hai...");
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append("receipt", compressedFile);

      const result = await uploadChatReceiptAction(formData);
      if (result.error) throw new Error(result.error);
      
      if (result.success && result.receipt) {
        toast.success("Image uploaded!");
        
        // Add a message to the UI to show the image
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            content: `[System: User uploaded a receipt. URL: ${result.receipt.secureUrl}]`,
            timestamp: new Date(),
          },
        ]);
        
        // Send this message to the assistant so it knows the receipt is uploaded
        await sendMessage(`[System: User uploaded a receipt. URL: ${result.receipt.secureUrl}]`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Image upload fail ho gaya. Kripya dobara try karein.");
    } finally {
      setIsUploading(false);
      // reset file input
      e.target.value = "";
    }
  };

  const handleQuickReply = (reply: string) => {
    setUsedReplies((prev) => new Set([...prev, reply]));
    sendMessage(reply);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const toggleVoice = () => {
    if (!speechSupported) {
      toast.error("Aapke browser mein voice input supported nahi hai.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.lang = language === "english" ? "en-IN" : "hi-IN";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
      setIsListening(false);
    };
    r.onerror = () => { toast.error("Voice input mein problem. Dobara try karein."); setIsListening(false); };
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  };

  const handleNewChat = () => {
    setMessages([
      {
        role: "assistant",
        content: `${initialGreeting}\n\n_${dailyMotivation}_\n\nAaj main aapki kis tarah madad karun?`,
        timestamp: new Date(),
      },
    ]);
    setConversationId(null);
    setUsedReplies(new Set());
    setInput("");
  };

  const showInitialActions = messages.length === 1;
  const quickActions = QUICK_ACTIONS[language];

  return (
    <div className="flex flex-col h-full bg-[#ECE5DD] dark:bg-[#0b1014]">
      {/* WhatsApp-style header */}
      <div className="bg-[#128C7E] dark:bg-[#1F2C33] text-white px-4 py-3 flex items-center gap-3 shadow-md flex-shrink-0">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-6 h-6 text-white" />
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-base leading-tight">Kharcha Saathi</h2>
          <p className="text-xs text-white/70 leading-tight">
            {isLoading ? "Soch raha hoon..." : "Online"}
          </p>
        </div>

        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Languages className="w-3.5 h-3.5" />
            {LANG_LABELS[language]}
          </button>

          {showLangPicker && (
            <div className="absolute right-0 top-10 bg-white dark:bg-[#1F2C33] rounded-xl shadow-xl border border-border z-50 overflow-hidden min-w-[140px]">
              {(["hinglish", "hindi", "english"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLangPicker(false); }}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors",
                    language === lang
                      ? "bg-[#128C7E] text-white"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span>{lang === "hinglish" ? "Hinglish" : lang === "hindi" ? "हिंदी" : "English"}</span>
                  {language === lang && <span className="text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New chat */}
        <button
          onClick={handleNewChat}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
          title="Naya Chat"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages area — WhatsApp wallpaper style */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
        onClick={() => setShowLangPicker(false)}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23DCF8C6' opacity='0.15'/%3E%3C/svg%3E\")" }}
      >
        {/* Initial quick actions */}
        {showInitialActions && (
          <div className="flex flex-col gap-2 mb-4 px-1">
            {quickActions.map((action) => (
              <button
                key={action.value}
                onClick={() => sendMessage(action.value)}
                disabled={isLoading}
                className={cn(
                  "w-full py-4 px-5 rounded-2xl text-left text-sm font-semibold shadow-sm transition-all duration-150 active:scale-95",
                  action.primary
                    ? "bg-[#128C7E] text-white shadow-[#128C7E]/30 hover:bg-[#0f7167]"
                    : "bg-white dark:bg-[#1F2C33] text-foreground border border-border hover:bg-gray-50 dark:hover:bg-[#2a3942]"
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const isLast = idx === messages.length - 1;

          return (
            <div key={idx} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] flex flex-col gap-1", isUser && "items-end")}>
                {/* Expense summary card (shown before assistant bubble) */}
                {!isUser && msg.expenseSummary && (msg.expenseSummary as any).type === "confirmation" && (
                  <div className="bg-white dark:bg-[#1F2C33] rounded-2xl rounded-tl-sm shadow-sm border-l-4 border-[#128C7E] overflow-hidden mb-1 max-w-xs">
                    <div className="bg-[#128C7E] px-4 py-2">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">📝 Kharcha Summary</p>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      {[
                        ["Cheez", (msg.expenseSummary as any).expenseName],
                        ["Amount", `₹${((msg.expenseSummary as any).amount || 0).toLocaleString("en-IN")}`],
                        ["Category", (msg.expenseSummary as any).category],
                        ["Paid By", (msg.expenseSummary as any).paidBy],
                        ["Date", (msg.expenseSummary as any).dateMode === "current" ? "Abhi (server time)" : "Custom"],
                        ["Kahan Se", (msg.expenseSummary as any).purchasedFrom],
                        ["Location", (msg.expenseSummary as any).location],
                        ["Notes", (msg.expenseSummary as any).notes],
                      ]
                        .filter(([, v]) => v)
                        .map(([label, value]) => (
                          <div key={label} className="flex justify-between gap-4 text-sm">
                            <span className="text-muted-foreground text-xs">{label}</span>
                            <span className="font-medium text-foreground text-xs text-right max-w-[160px] truncate">{value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Saved confirmation */}
                {!isUser && msg.isExpenseSaved && (
                  <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-2 mb-1">
                    <span className="text-lg">✅</span>
                    <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                      Kharcha save ho gaya!
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={cn(
                    "relative px-3 py-2 rounded-2xl shadow-sm max-w-xs",
                    isUser
                      ? "bg-[#DCF8C6] dark:bg-[#005C4B] text-[#111] dark:text-white rounded-br-none"
                      : "bg-white dark:bg-[#1F2C33] text-foreground rounded-bl-none"
                  )}
                >
                  <div
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
                  <p className={cn(
                    "text-[10px] mt-1 text-right",
                    isUser ? "text-[#666] dark:text-white/40" : "text-muted-foreground"
                  )}>
                    {formatTime(msg.timestamp)}
                    {isUser && <span className="ml-1 text-[#53bdeb]">✓✓</span>}
                  </p>
                </div>

                {/* Quick replies — only show for last assistant message */}
                {!isUser && isLast && msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pl-1">
                    {msg.quickReplies.map((reply) => {
                      if (reply === "📷 Upload Photo") {
                        return (
                          <label
                            key={reply}
                            className={cn(
                              "px-4 py-2.5 rounded-full text-sm font-semibold border-2 transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center",
                              isUploading || usedReplies.has(reply)
                                ? "opacity-50 pointer-events-none bg-muted border-border text-muted-foreground"
                                : "bg-[#128C7E] border-[#128C7E] text-white shadow-md hover:bg-[#0f7167]"
                            )}
                          >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {isUploading ? "Uploading..." : reply}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                handleQuickReply(reply);
                                handleImageUpload(e);
                              }}
                              disabled={isUploading || isLoading || usedReplies.has(reply)}
                            />
                          </label>
                        );
                      }

                      return (
                        <button
                          key={reply}
                          onClick={() => handleQuickReply(reply)}
                          disabled={isLoading || usedReplies.has(reply)}
                          className={cn(
                            "px-4 py-2.5 rounded-full text-sm font-semibold border-2 transition-all duration-150 active:scale-95",
                            usedReplies.has(reply)
                              ? "opacity-30 cursor-not-allowed bg-muted border-border text-muted-foreground"
                              : reply.includes("Confirm") || reply.includes("Save")
                              ? "bg-[#128C7E] border-[#128C7E] text-white shadow-md hover:bg-[#0f7167]"
                              : reply.includes("Cancel") || reply.includes("❌")
                              ? "bg-red-50 border-red-400 text-red-600 dark:bg-red-900/20"
                              : "bg-white dark:bg-[#1F2C33] border-[#128C7E]/50 text-[#128C7E] dark:text-[#25D366] hover:bg-[#128C7E]/10"
                          )}
                        >
                          {reply}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#1F2C33] rounded-2xl rounded-bl-none shadow-sm px-4 py-3 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#128C7E]/70 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-[#128C7E]/70 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-[#128C7E]/70 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-style input bar */}
      <div className="bg-[#F0F2F5] dark:bg-[#1F2C33] px-3 py-2 flex items-end gap-2 flex-shrink-0">
        {/* Text input */}
        <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-3xl flex items-end px-4 py-2 shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "Sun raha hoon... 🎤"
                : language === "english"
                ? "Type a message..."
                : language === "hindi"
                ? "लिखें या बोलकर बताएं..."
                : "Likhein ya bolkar batayein..."
            }
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm focus:outline-none max-h-32 min-h-[24px] text-foreground placeholder:text-muted-foreground leading-relaxed"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
        </div>

        {/* Attachment Button */}
        {!input.trim() && (
          <label
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm flex-shrink-0 text-gray-500 hover:text-gray-700 bg-white dark:bg-[#2A3942]",
              isUploading && "opacity-50 pointer-events-none"
            )}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading || isLoading}
            />
          </label>
        )}

        {/* Voice button */}
        {!input.trim() && (
          <button
            onClick={toggleVoice}
            disabled={isLoading}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm flex-shrink-0",
              isListening
                ? "bg-red-500 text-white scale-110"
                : "bg-[#128C7E] text-white hover:bg-[#0f7167]"
            )}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        {/* Send button */}
        {input.trim() && (
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading}
            className="w-12 h-12 rounded-full bg-[#128C7E] text-white flex items-center justify-center hover:bg-[#0f7167] disabled:opacity-50 transition-all duration-200 shadow-sm flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
