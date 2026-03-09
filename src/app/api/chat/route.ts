import { NextRequest, NextResponse } from "next/server";
import { routeChat } from "@/lib/providers";

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Default to gemini if no model specified
    const provider = model || "gemini";

    const result = await routeChat(provider, messages);
    return NextResponse.json({ content: result.content });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
