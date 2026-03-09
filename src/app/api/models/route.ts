import { NextResponse } from "next/server";

const MODEL_KEYS: Record<string, string> = {
  gemini: "GEMINI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
  chatgpt: "OPENAI_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
};

const MODEL_INFO: Record<string, { name: string; desc: string }> = {
  gemini: { name: "Gemini", desc: "Google · Fast & structured" },
  claude: { name: "Claude", desc: "Anthropic · Writing & reasoning" },
  chatgpt: { name: "ChatGPT", desc: "OpenAI · Versatile all-rounder" },
  perplexity: { name: "Perplexity", desc: "Real-time web search" },
};

export async function GET() {
  const models = Object.entries(MODEL_INFO).map(([id, info]) => ({
    id,
    name: info.name,
    desc: info.desc,
    available: !!process.env[MODEL_KEYS[id]],
  }));

  return NextResponse.json({ models });
}
