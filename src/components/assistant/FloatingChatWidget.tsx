"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, MicOff, Loader2, RefreshCw, Languages, Bot, X, Minimize2, Maximize2, MessageCircle, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { compressImage } from "@/lib/imageUtils";

type Language = "hinglish" | "hindi" | "english";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  quickReplies?: string[];
  expenseSummary?: Record<string, unknown> | null;
  isExpenseSaved?: boolean;
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
  hindi: "हिं",
  english: "EN",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// Compute greeting client-side (IST)
function getClientGreeting(): string {
  const now = new Date();
  const hour = parseInt(
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(now)
  );
  if (hour >= 5 && hour < 12) return "Good Morning Sachann Family 🌤️";
  if (hour >= 12 && hour < 17) return "Good Afternoon 👋";
  if (hour >= 17 && hour < 22) return "Good Evening 🌙";
  return "Good Night ✨";
}

const MOTIVATIONS = [
  "Har chhota record business ko strong banata hai. 💪",
  "Aaj ka sahi hisaab, kal ka behtar decision. 📊",
  "Chhoti bachat bhi business ko aage badhati hai. 💰",
  "Safalta planning aur consistency se banti hai. ✅",
  "Har expense ko note karna smart business ki nishani hai. 📝",
  "Ek-ek kadam se bada brand banta hai. 🌟",
  "Aaj ki mehnat kal ki pehchaan banegi. 🙏",
  "Sahi hisaab se business hamesha control mein rehta hai. 🎯",
];

function getDailyMsg(): string {
  const index = Math.floor(Math.random() * MOTIVATIONS.length);
  return MOTIVATIONS[index];
}
function formatContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code style='background:rgba(0,0,0,0.08);border-radius:4px;padding:1px 4px;font-size:12px'>$1</code>")
    .replace(/\n/g, "<br/>");
}

// ─── Inner Chat Panel ─────────────────────────────────────────────────────────
function ChatPanel({
  isOpen,
  onClose,
  isExpanded,
  setIsExpanded,
  initialGreeting,
  dailyMotivation,
}: {
  isOpen: boolean;
  onClose: () => void;
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
  initialGreeting: string;
  dailyMotivation: string;
}) {
  const [language, setLanguage] = useState<Language>("hinglish");
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    setMessages([{
      role: "assistant" as const,
      content: `${getClientGreeting()}\n\n_${getDailyMsg()}_\n\nAaj main aapki kis tarah madad karun?`,
      timestamp: new Date(),
    }]);
  }, []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [usedReplies, setUsedReplies] = useState<Set<string>>(new Set());
  const [showLangPicker, setShowLangPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      setSpeechSupported(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages, isLoading, isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = { role: "user", content: text.trim(), timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      
      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), conversationId, history, language }),
        });
        const data = await res.json();

        if (!res.ok) {
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: data.message || "Kuch problem aayi. Dobara try karein. 🙏",
            timestamp: new Date(),
          }]);
          return;
        }

        if (data.conversationId) setConversationId(data.conversationId);
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          quickReplies: data.quickReplies || [],
          expenseSummary: data.expenseSummary || null,
          isExpenseSaved: data.isExpenseSaved || false,
        }]);

        if (data.isExpenseSaved) toast.success("✅ Kharcha save ho gaya!");
      } catch {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "Network problem. Internet check karein aur dobara try karein. 🙏",
          timestamp: new Date(),
        }]);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [messages, conversationId, isLoading, language]
  );

  const handleQuickReply = (reply: string) => {
    setUsedReplies((prev) => new Set([...prev, reply]));
    sendMessage(reply);
  };

  const toggleVoice = () => {
    if (!speechSupported) { toast.error("Voice input supported nahi hai."); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.lang = language === "english" ? "en-IN" : "hi-IN";
    r.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsListening(false); };
    r.onerror = () => { toast.error("Voice error. Try again."); setIsListening(false); };
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info("Compressing aur upload ho rahi hai...");
    try {
      // 1. Compress client-side
      const compressedFile = await compressImage(file);
      const originalSize = file.size;
      const compressedSize = compressedFile.size;
      if (originalSize > 0 && compressedSize < originalSize) {
        const saved = ((originalSize - compressedSize) / originalSize * 100).toFixed(0);
        if (Number(saved) > 1) toast.success(`Image ${saved}% compress hua!`);
      }

      // 2. Upload via /api/assistant/attach-receipt (saves to Cloudinary + MongoDB draft)
      const formData = new FormData();
      formData.append("receipt", compressedFile);
      const res = await fetch("/api/assistant/attach-receipt", { method: "POST", body: formData });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      if (result.success && result.receipt) {
        toast.success("📎 Receipt attach ho gayi!");

        // 3. Show in chat UI
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            content: `📎 Receipt attached`,
            timestamp: new Date(),
          },
        ]);

        // 4. Notify Gemini to proceed to confirmation
        await sendMessage(`[System: User ne ek receipt upload ki hai. URL: ${result.receipt.secureUrl}. Receipt draft mein save ho gayi hai. Ab confirmation summary dikhao.]`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Image upload fail hua. Dobara try karein.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleNewChat = () => {
    setMessages([{
      role: "assistant",
      content: `${getClientGreeting()}\n\n_${getDailyMsg()}_\n\nAaj main aapki kis tarah madad karun?`,
      timestamp: new Date(),
    }]);
    setConversationId(null);
    setUsedReplies(new Set());
    setInput("");
  };

  const showInitialActions = messages.length === 1;

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col shadow-2xl overflow-hidden transition-all duration-300 bg-[#ECE5DD]",
        // Mobile: full screen
        "inset-0 w-full h-full rounded-none",
        // Desktop: floating widget
        "md:inset-auto md:bottom-24 md:right-8 md:rounded-2xl md:border md:border-white/10",
        isExpanded
          ? "md:w-[440px] md:h-[700px]"
          : "md:w-[380px] md:h-[600px]"
      )}
      style={{ animation: "slideUp 0.25s ease-out" }}
    >
      {/* WhatsApp-style header */}
      <div className="bg-[#128C7E] text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight">Kharcha Saathi</h3>
          <p className="text-[11px] text-white/70">{isLoading ? "Soch raha hoon..." : "Online"}</p>
        </div>

        {/* Language */}
        <div className="relative">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="bg-white/20 hover:bg-white/30 rounded-full px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            <Languages className="w-3 h-3" />
            {LANG_LABELS[language]}
          </button>
          {showLangPicker && (
            <div className="absolute right-0 top-9 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden min-w-[130px]">
              {(["hinglish", "hindi", "english"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLangPicker(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 text-xs flex items-center justify-between",
                    language === lang ? "bg-[#128C7E] text-white" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {lang === "hinglish" ? "Hinglish" : lang === "hindi" ? "हिंदी" : "English"}
                  {language === lang && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleNewChat} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center" title="New chat">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setIsExpanded(!isExpanded)} className="hidden md:flex w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 items-center justify-center">
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-red-500 flex items-center justify-center transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#ECE5DD]"
        onClick={() => setShowLangPicker(false)}
      >
        {/* Quick actions shown initially */}
        {showInitialActions && (
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_ACTIONS[language].map((action) => (
              <button
                key={action.value}
                onClick={() => sendMessage(action.value)}
                disabled={isLoading}
                className={cn(
                  "py-2 px-3.5 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95 border",
                  action.primary
                    ? "bg-[#128C7E] text-white border-[#128C7E] hover:bg-[#0f7167]"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
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
              <div className={cn("flex flex-col gap-1 max-w-[85%]", isUser && "items-end")}>
                {/* Summary card */}
                {!isUser && msg.expenseSummary && (msg.expenseSummary as any).type === "confirmation" && (
                  <div className="bg-white rounded-xl rounded-tl-none shadow-sm border-l-4 border-[#128C7E] overflow-hidden mb-1 w-full">
                    <div className="bg-[#128C7E] px-3 py-1.5">
                      <p className="text-[11px] font-bold text-white uppercase tracking-wider">📝 Kharcha Summary</p>
                    </div>
                    <div className="px-3 py-2 space-y-1.5">
                      {[
                        ["Cheez", (msg.expenseSummary as any).expenseName],
                        ["Amount", `₹${((msg.expenseSummary as any).amount || 0).toLocaleString("en-IN")}`],
                        ["Category", (msg.expenseSummary as any).category],
                        ["Paid By", (msg.expenseSummary as any).paidBy],
                        ["Kahan Se", (msg.expenseSummary as any).purchasedFrom],
                        ["Notes", (msg.expenseSummary as any).notes],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-2">
                          <span className="text-[11px] text-gray-500">{label}</span>
                          <span className="text-[11px] font-semibold text-gray-800 text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isUser && msg.isExpenseSaved && (
                  <div className="flex items-center gap-2 bg-green-100 border border-green-200 rounded-xl px-3 py-2 mb-1">
                    <span>✅</span>
                    <span className="text-xs font-semibold text-green-700">Kharcha save ho gaya!</span>
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={cn(
                    "relative px-3 py-2 rounded-2xl shadow-sm",
                    isUser
                      ? "bg-[#DCF8C6] text-gray-900 rounded-br-none"
                      : "bg-white text-gray-900 rounded-bl-none"
                  )}
                >
                  <div
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
                  <p className={cn("text-[10px] mt-0.5 text-right", isUser ? "text-gray-400" : "text-gray-400")}>
                    {formatTime(msg.timestamp)}
                    {isUser && <span className="ml-1 text-[#53bdeb]">✓✓</span>}
                  </p>
                </div>

                {/* Quick replies */}
                {!isUser && isLast && msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1 pl-1">
                    {msg.quickReplies.map((reply) => {
                      if (reply === "📷 Upload Photo") {
                        return (
                          <label
                            key={reply}
                            className={cn(
                              "px-3 py-2 rounded-full text-[11px] font-semibold border transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center",
                              isUploading || usedReplies.has(reply)
                                ? "opacity-50 pointer-events-none bg-gray-100 border-gray-200 text-gray-400"
                                : "bg-[#128C7E] border-[#128C7E] text-white shadow-sm hover:bg-[#0f7167]"
                            )}
                          >
                            {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
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
                            "px-3 py-2 rounded-full text-[11px] font-semibold border transition-all duration-150 active:scale-95",
                            usedReplies.has(reply)
                              ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400"
                              : reply.includes("Confirm") || reply.includes("Save")
                              ? "bg-[#128C7E] border-[#128C7E] text-white shadow-sm hover:bg-[#0f7167]"
                              : reply.includes("Cancel") || reply.includes("❌")
                              ? "bg-red-50 border-red-300 text-red-600"
                              : "bg-white border-[#128C7E]/50 text-[#128C7E] hover:bg-[#128C7E]/10"
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
            <div className="bg-white rounded-2xl rounded-bl-none shadow-sm px-4 py-3 flex gap-1.5 items-center">
              <div className="w-2 h-2 rounded-full bg-[#128C7E]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-[#128C7E]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-[#128C7E]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="bg-[#F0F2F5] px-3 py-2 flex items-end gap-2 flex-shrink-0">
        <div className="flex-1 bg-white rounded-3xl flex items-end px-4 py-2 shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={isListening ? "Sun raha hoon... 🎤" : "Likhein ya bolkar batayein..."}
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm focus:outline-none max-h-24 text-gray-800 placeholder:text-gray-400 leading-relaxed"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 96)}px`;
            }}
          />
        </div>

        {/* Attachment Button */}
        {!input.trim() && (
          <label
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm flex-shrink-0 text-gray-500 hover:text-gray-700 bg-white",
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

        {!input.trim() ? (
          <button
            onClick={toggleVoice}
            disabled={isLoading}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0",
              isListening ? "bg-red-500 text-white scale-110" : "bg-[#128C7E] text-white hover:bg-[#0f7167]"
            )}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        ) : (
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading}
            className="w-11 h-11 rounded-full bg-[#128C7E] text-white flex items-center justify-center hover:bg-[#0f7167] disabled:opacity-50 transition-all shadow-sm flex-shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Floating Button Widget ────────────────────────────────────────────────────
export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // Don't show on the assistant page itself
  if (pathname === "/assistant") return null;

  return (
    <>
      {/* Slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Chat panel */}
      <ChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        initialGreeting={getClientGreeting()}
        dailyMotivation={getDailyMsg()}
      />

      {/* Floating button - Hidden when panel is open */}
      <button
        onClick={() => { setIsOpen(!isOpen); }}
        className={cn(
          "fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 lg:bottom-8 lg:right-8",
          isOpen
            ? "opacity-0 pointer-events-none scale-95"
            : "bg-[#128C7E] hover:bg-[#0f7167] hover:scale-110 opacity-100"
        )}
        style={{ animation: "popIn 0.3s ease-out" }}
        title="Kharcha Saathi"
      >
          <MessageCircle className="w-7 h-7 text-white" />

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#128C7E] animate-ping opacity-20" />
        )}
      </button>
    </>
  );
}
