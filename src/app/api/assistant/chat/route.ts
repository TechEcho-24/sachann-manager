/**
 * Chat API Route - Main Gemini chatbot endpoint
 * POST /api/assistant/chat
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { geminiClient, GEMINI_MODEL } from "@/lib/gemini/client";
import { SYSTEM_INSTRUCTION } from "@/lib/gemini/system-instruction";
import connectDB from "@/lib/db";
import ExpenseDraft from "@/models/ExpenseDraft";
import Expense from "@/models/Expense";
import { EXPENSE_CATEGORIES, PAYERS } from "@/lib/constants";
import mongoose from "mongoose";

// Rate limit simple tracking (in-memory for now)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(userId);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Tool executor — handles whitelisted Gemini function calls server-side
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  conversationId: string
): Promise<string> {
  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  switch (toolName) {
    case "get_or_create_draft": {
      let draft = await ExpenseDraft.findOne({
        userId: userObjectId,
        status: "collecting",
      }).sort({ createdAt: -1 });

      if (!draft) {
        draft = await ExpenseDraft.create({
          userId: userObjectId,
          conversationId,
          status: "collecting",
          currentStep: "name",
          idempotencyKey: `${userId}-${Date.now()}`,
        });
      }
      return JSON.stringify({
        draftId: draft._id.toString(),
        expenseName: draft.expenseName,
        amount: draft.amount,
        category: draft.category,
        paidBy: draft.paidBy,
        dateMode: draft.dateMode,
        purchasedFrom: draft.purchasedFrom,
        location: draft.location,
        notes: draft.notes,
        receipts: draft.receipts,
        currentStep: draft.currentStep,
        status: draft.status,
      });
    }

    case "update_draft": {
      const draft = await ExpenseDraft.findOne({
        userId: userObjectId,
        status: { $in: ["collecting", "awaiting-confirmation"] },
      }).sort({ createdAt: -1 });

      if (!draft) return JSON.stringify({ error: "No active draft found" });

      // Only allow updating whitelisted fields
      const allowedFields = [
        "expenseName", "amount", "category", "paidBy",
        "dateMode", "customDateTime", "purchasedFrom",
        "location", "notes", "currentStep", "status", "receipts",
      ];

      for (const field of allowedFields) {
        if (args[field] !== undefined) {
          // Validate category
          if (field === "category") {
            if (!EXPENSE_CATEGORIES.includes(args[field] as any)) {
              return JSON.stringify({ error: `Invalid category: ${args[field]}` });
            }
          }
          // Validate paidBy
          if (field === "paidBy") {
            if (!PAYERS.includes(args[field] as any)) {
              return JSON.stringify({ error: `Invalid payer: ${args[field]}` });
            }
          }
          // Validate amount
          if (field === "amount") {
            const amt = parseFloat(String(args[field]));
            if (isNaN(amt) || amt <= 0) {
              return JSON.stringify({ error: "Amount must be a positive number" });
            }
            (draft as any)[field] = amt;
            continue;
          }
          (draft as any)[field] = args[field];
        }
      }

      // If all required fields present, move to awaiting-confirmation
      if (
        draft.expenseName &&
        draft.amount &&
        draft.category &&
        draft.paidBy &&
        args.status !== "awaiting-confirmation"
      ) {
        draft.status = "awaiting-confirmation";
      }

      await draft.save();
      return JSON.stringify({
        success: true,
        draftId: draft._id.toString(),
        expenseName: draft.expenseName,
        amount: draft.amount,
        category: draft.category,
        paidBy: draft.paidBy,
        dateMode: draft.dateMode,
        purchasedFrom: draft.purchasedFrom,
        location: draft.location,
        notes: draft.notes,
        receipts: draft.receipts,
        status: draft.status,
      });
    }

    case "confirm_save_expense": {
      const draft = await ExpenseDraft.findOne({
        userId: userObjectId,
        status: "awaiting-confirmation",
      }).sort({ createdAt: -1 });

      if (!draft) {
        return JSON.stringify({ error: "No draft awaiting confirmation" });
      }

      // Validate all required fields server-side
      if (!draft.expenseName || !draft.amount || !draft.category || !draft.paidBy) {
        return JSON.stringify({ error: "Missing required fields in draft" });
      }

      // Check idempotency — prevent double save
      const existingExpense = await Expense.findOne({
        "metadata.idempotencyKey": draft.idempotencyKey,
      });
      if (existingExpense) {
        draft.status = "saved";
        await draft.save();
        return JSON.stringify({ success: true, alreadySaved: true, expenseId: existingExpense._id.toString() });
      }

      // Determine date
      const expenseDate = draft.dateMode === "custom" && draft.customDateTime
        ? draft.customDateTime
        : new Date();

      // Create the actual expense
      const expense = await Expense.create({
        title: draft.expenseName,
        amount: draft.amount,
        category: draft.category as any,
        paidBy: draft.paidBy as any,
        date: expenseDate,
        vendor: draft.purchasedFrom,
        description: draft.notes,
        location: draft.location ? { type: "manual", areaName: draft.location } : undefined,
        receipts: draft.receipts && draft.receipts.length > 0 ? draft.receipts : [],
        isArchived: false,
      });

      // Mark draft as saved
      draft.status = "saved";
      await draft.save();

      return JSON.stringify({
        success: true,
        expenseId: expense._id.toString(),
        expenseName: expense.title,
        amount: expense.amount,
        category: expense.category,
        paidBy: expense.paidBy,
        date: expense.date.toISOString(),
      });
    }

    case "cancel_draft": {
      await ExpenseDraft.updateMany(
        { userId: userObjectId, status: { $in: ["collecting", "awaiting-confirmation"] } },
        { $set: { status: "cancelled" } }
      );
      return JSON.stringify({ success: true });
    }

    case "get_expense_summary": {
      const period = (args.period as string) || "this_month";
      const now = new Date();
      let startDate: Date;
      let endDate = new Date();
      let periodLabel = "";

      if (period === "today") {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        periodLabel = "Aaj";
      } else if (period === "this_month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        periodLabel = `${now.toLocaleString("en-IN", { month: "long" })} ${now.getFullYear()}`;
      } else if (period === "last_month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = lastMonth;
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        periodLabel = `${lastMonth.toLocaleString("en-IN", { month: "long" })} ${lastMonth.getFullYear()}`;
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        periodLabel = "Is mahine";
      }

      const query: Record<string, unknown> = {
        isArchived: false,
        date: { $gte: startDate, $lte: endDate },
      };

      if (args.category) query.category = args.category;
      if (args.paidBy) query.paidBy = args.paidBy;

      const [result] = await Expense.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
            maxAmount: { $max: "$amount" },
          },
        },
      ]);

      return JSON.stringify({
        period: periodLabel,
        total: result?.total || 0,
        count: result?.count || 0,
        avgAmount: result?.avgAmount ? Math.round(result.avgAmount) : 0,
        maxAmount: result?.maxAmount || 0,
        category: args.category || "Sabhi categories",
        paidBy: args.paidBy || "Sabhi log",
      });
    }

    case "get_recent_expenses": {
      const limit = Math.min((args.limit as number) || 5, 10);
      const expenses = await Expense.find({ isArchived: false })
        .sort({ date: -1 })
        .limit(limit)
        .select("title amount category paidBy date");

      return JSON.stringify({
        expenses: expenses.map((e) => ({
          name: e.title,
          amount: e.amount,
          category: e.category,
          paidBy: e.paidBy,
          date: e.date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
        })),
      });
    }

    case "get_category_breakdown": {
      const period = (args.period as string) || "this_month";
      const now = new Date();
      let startDate: Date;
      let endDate = new Date();

      if (period === "today") {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const breakdown = await Expense.aggregate([
        { $match: { isArchived: false, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]);

      return JSON.stringify({ breakdown: breakdown.map((b) => ({ category: b._id, total: b.total, count: b.count })) });
    }

    case "get_paid_by_breakdown": {
      const period = (args.period as string) || "this_month";
      const now = new Date();
      const startDate = period === "today"
        ? new Date(now.setHours(0, 0, 0, 0))
        : new Date(now.getFullYear(), now.getMonth(), 1);

      const breakdown = await Expense.aggregate([
        { $match: { isArchived: false, date: { $gte: startDate } } },
        { $group: { _id: "$paidBy", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]);

      return JSON.stringify({ breakdown: breakdown.map((b) => ({ paidBy: b._id, total: b.total, count: b.count })) });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// Tool definitions for Gemini function calling
const TOOLS = [
  {
    name: "get_or_create_draft",
    description: "Get the current active expense draft, or create a new one if none exists.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "update_draft",
    description: "Update fields of the active expense draft.",
    parameters: {
      type: "object",
      properties: {
        expenseName: { type: "string", description: "Name/title of the expense" },
        amount: { type: "number", description: "Amount in INR" },
        category: { type: "string", description: "Expense category" },
        paidBy: { type: "string", description: "Who paid: Mummy, Papa, Anuj, or Anurag" },
        dateMode: { type: "string", description: "'current' or 'custom'" },
        purchasedFrom: { type: "string", description: "Where purchased (optional)" },
        location: { type: "string", description: "Location (optional)" },
        notes: { type: "string", description: "Additional notes (optional)" },
        receipts: { 
          type: "array", 
          description: "An array of receipt objects if the user uploaded an image",
          items: {
            type: "object",
            properties: {
              publicId: { type: "string" },
              secureUrl: { type: "string" },
              width: { type: "number" },
              height: { type: "number" },
              format: { type: "string" },
              bytes: { type: "number" }
            }
          }
        },
        currentStep: { type: "string", description: "Current step in the flow" },
        status: { type: "string", description: "Draft status" },
      },
    },
  },
  {
    name: "confirm_save_expense",
    description: "Save the confirmed expense to the database. Only call this after explicit user confirmation.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "cancel_draft",
    description: "Cancel the active expense draft without saving.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_expense_summary",
    description: "Get expense summary for a time period",
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", description: "today, this_month, or last_month" },
        category: { type: "string", description: "Optional category filter" },
        paidBy: { type: "string", description: "Optional paidBy filter" },
      },
    },
  },
  {
    name: "get_recent_expenses",
    description: "Get the most recent expenses",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of expenses to retrieve (max 10)" },
      },
    },
  },
  {
    name: "get_category_breakdown",
    description: "Get spending breakdown by category",
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", description: "today or this_month" },
      },
    },
  },
  {
    name: "get_paid_by_breakdown",
    description: "Get spending breakdown by person (paidBy)",
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", description: "today or this_month" },
      },
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        {
          error: "rate_limit",
          message: "AI assistant ki free usage limit temporarily poori ho gayi hai. Thodi der baad dobara try karein. 🙏",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, conversationId, history = [], language = "hinglish" } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const convoId = conversationId || `conv-${userId}-${Date.now()}`;

    // Build history for Gemini (last 10 messages only)
    const recentHistory = history.slice(-10);

    // Build language-specific system instruction
    const LANG_OVERRIDES: Record<string, string> = {
      hinglish: "\n\nCRITICAL LANGUAGE RULE: You MUST respond ONLY in Hinglish (Hindi words written in Roman/English script mixed with English). Example: 'Kharcha note ho gaya! Amount ₹500 hai.' Never use Devanagari script. Never respond in pure English.",
      hindi: "\n\nCRITICAL LANGUAGE RULE: You MUST respond ONLY in simple Hindi. You MAY use Devanagari script OR Roman script for Hindi words. Example: 'Kharcha note ho gaya! Rakam ₹500 hai.' Keep it very simple and easy to understand for elderly users.",
      english: "\n\nCRITICAL LANGUAGE RULE: You MUST respond ONLY in English. Do not use any Hindi words. Respond in clear, simple, friendly English.",
    };

    const langInstruction = LANG_OVERRIDES[language] || LANG_OVERRIDES["hinglish"];
    const systemInstructionWithLang = SYSTEM_INSTRUCTION + langInstruction;

    // Run multi-turn conversation with Gemini
    let response: string | null = null;
    let quickReplies: string[] = [];
    let expenseSummary: Record<string, unknown> | null = null;
    let isExpenseSaved = false;

    const chat = geminiClient.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: systemInstructionWithLang,
        tools: [{ functionDeclarations: TOOLS as any }],
      },
      history: recentHistory.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

    // Send clean message (no language prefix — language is set in system instruction)
    let chatResponse = await chat.sendMessage({ message });

    // Handle function calls in a loop
    let iterations = 0;
    while (iterations < 5) {
      iterations++;
      const candidate = chatResponse.candidates?.[0];
      if (!candidate) break;

      // Check for function calls
      const functionCalls = candidate.content?.parts?.filter((p: any) => p.functionCall);
      
      if (!functionCalls || functionCalls.length === 0) {
        // Plain text response
        response = candidate.content?.parts
          ?.filter((p: any) => p.text)
          ?.map((p: any) => p.text)
          ?.join("") || "";
        break;
      }

      // Execute function calls
      const functionResults = [];
      for (const part of functionCalls) {
        const fc = (part as any).functionCall;
        const name = fc?.name;
        const args = fc?.args;
        const result = await executeTool(name, args || {}, userId, convoId);
        functionResults.push({
          functionResponse: {
            name,
            response: { result },
          },
        });

        // Track if expense was saved
        if (name === "confirm_save_expense") {
          try {
            const parsed = JSON.parse(result);
            if (parsed.success) {
              isExpenseSaved = true;
              expenseSummary = parsed;
            }
          } catch (e) {}
        }

        // Build expense summary for UI if draft updated
        if (name === "update_draft" || name === "get_or_create_draft") {
          try {
            const parsed = JSON.parse(result);
            if (parsed.status === "awaiting-confirmation" && parsed.expenseName && parsed.amount) {
              expenseSummary = {
                type: "confirmation",
                expenseName: parsed.expenseName,
                amount: parsed.amount,
                category: parsed.category,
                paidBy: parsed.paidBy,
                dateMode: parsed.dateMode,
                purchasedFrom: parsed.purchasedFrom,
                location: parsed.location,
                notes: parsed.notes,
                receipts: parsed.receipts,
              };
            }
          } catch (e) {}
        }
      }

      // Send function results back to Gemini
      chatResponse = await chat.sendMessage({ message: functionResults as any });
    }

    // Extract quick replies from the response text
    const quickReplyPatterns = [
      "Haan",
      "Nahi",
      "Skip",
      "Mummy",
      "Papa",
      "Anuj",
      "Anurag",
      "Abhi ka",
      "Purani Date",
      "Naya Kharcha",
      "Aaj ka total",
    ];

    if (expenseSummary && (expenseSummary as any).type === "confirmation") {
      quickReplies = ["✅ Confirm & Save", "✏️ Edit", "❌ Cancel"];
    } else if (
      response?.toLowerCase().includes("photo") ||
      response?.toLowerCase().includes("receipt") ||
      response?.toLowerCase().includes("bill") ||
      response?.toLowerCase().includes("upload")
    ) {
      quickReplies = ["📷 Upload Photo", "Nahi"];
    }

    return NextResponse.json({
      message: response || "Main samajh nahi paaya. Kripya dobara try karein.",
      conversationId: convoId,
      quickReplies,
      expenseSummary,
      isExpenseSaved,
    });
  } catch (error: any) {
    console.error("Chat API error:", error?.message || error);

    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota")) {
      return NextResponse.json(
        {
          error: "rate_limit",
          message: "AI assistant ki free usage limit temporarily poori ho gayi hai. Thodi der baad dobara try karein. 🙏",
        },
        { status: 429 }
      );
    }

    if (error?.message?.includes("API_KEY") || error?.message?.includes("401") || error?.status === 401) {
      return NextResponse.json(
        {
          error: "api_key_invalid",
          message: "Gemini API key invalid hai. Please .env.local mein sahi key daalo. 🔑",
        },
        { status: 500 }
      );
    }

    const errorMessage = error?.message || "Unknown error";
    console.error("Full error:", errorMessage);

    return NextResponse.json(
      {
        error: "server_error",
        message: "Kuch technical problem aayi. Thodi der baad dobara try karein. 🙏",
        debug: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
