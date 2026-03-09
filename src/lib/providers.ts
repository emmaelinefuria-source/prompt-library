import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResult {
  content: string;
}

// --- Gemini ---
async function chatGemini(messages: ChatMessage[]): Promise<ChatResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content;
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage);
  return { content: result.response.text() };
}

// --- Claude ---
async function chatClaude(messages: ChatMessage[]): Promise<ChatResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic API key not configured");

  const client = new Anthropic({ apiKey });

  const result = await client.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 4096,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const text = result.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return { content: text };
}

// --- OpenAI (GPT-4o) ---
async function chatOpenAI(messages: ChatMessage[]): Promise<ChatResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const client = new OpenAI({ apiKey });

  const result = await client.chat.completions.create({
    model: "gpt-4o",
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  return { content: result.choices[0]?.message?.content || "" };
}

// --- Perplexity Sonar ---
async function chatPerplexity(messages: ChatMessage[]): Promise<ChatResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("Perplexity API key not configured");

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.perplexity.ai",
  });

  const result = await client.chat.completions.create({
    model: "sonar",
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  return { content: result.choices[0]?.message?.content || "" };
}

// --- Router ---
const PROVIDERS: Record<string, (messages: ChatMessage[]) => Promise<ChatResult>> = {
  gemini: chatGemini,
  claude: chatClaude,
  chatgpt: chatOpenAI,
  perplexity: chatPerplexity,
};

export async function routeChat(
  provider: string,
  messages: ChatMessage[]
): Promise<ChatResult> {
  const handler = PROVIDERS[provider];
  if (!handler) {
    throw new Error(`Unknown model provider: ${provider}`);
  }
  return handler(messages);
}
