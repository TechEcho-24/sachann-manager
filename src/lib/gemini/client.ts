/**
 * Gemini AI Client - SERVER ONLY
 * Never import this in a Client Component.
 * Never expose the API key to the browser.
 */
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

export const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
