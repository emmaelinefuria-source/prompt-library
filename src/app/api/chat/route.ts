import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MODEL_MAP: Record<string, string> = {
  "gemini-3-flash": "gemini-3-flash-preview",
  "gemini-3-flash-lite": "gemini-3.1-flash-lite-preview",
};

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();
    const modelId = MODEL_MAP[model] || "gemini-3-flash-preview";
    const gemini = genAI.getGenerativeModel({ model: modelId });

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = gemini.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const response = result.response.text();

    return NextResponse.json({ content: response });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
