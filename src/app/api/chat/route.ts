import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const DEFAULT_MODEL = "gemini-3-flash-preview";

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    const modelId = model || DEFAULT_MODEL;
    const gemini = genAI.getGenerativeModel({ model: modelId });

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map(
      (m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })
    );

    const lastMessage = messages[messages.length - 1].content;

    const chat = gemini.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const response = result.response.text();

    return NextResponse.json({ content: response });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
