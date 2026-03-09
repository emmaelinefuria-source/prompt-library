import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const VISION_MODEL = "gemini-2.0-flash";

const CANVAS_SECTIONS = [
  "Persona",
  "Task",
  "Context",
  "Output",
  "Audience",
  "Step-by-Step",
  "References",
  "Tonality",
] as const;

const EXTRACTION_PROMPT = `You are an OCR specialist. You are looking at a photo of a "Prompt Canvas" poster with 8 handwritten sections.

The 8 sections on the poster are:
1. Persona – Who should the AI act as?
2. Task – What is the main task or question?
3. Context – What background info or constraints?
4. Output – What format or structure is expected?
5. Audience – Who is the intended audience?
6. Step-by-Step – What steps or process to follow?
7. References – Any examples, links, or sources?
8. Tonality – What tone or style to use?

Carefully read the handwritten text in each section. Some sections may be empty.

Return your response as a JSON object with exactly these keys:
${CANVAS_SECTIONS.map((s) => `"${s}"`).join(", ")}

Each value should be the transcribed handwritten text for that section, or an empty string if the section is blank. Transcribe exactly what is written — do not interpret or rephrase. Return ONLY valid JSON, no markdown fences.`;

const ASSEMBLY_PROMPT = `You are a prompt engineering expert. Given the extracted sections from a Prompt Canvas, assemble them into a polished, ready-to-use prompt card.

Return your response as a JSON object with these keys:
- "title": A short, descriptive title for this prompt (max 8 words)
- "tagline": A one-sentence summary of what this prompt does
- "tool": The most appropriate AI tool for this prompt (e.g. "ChatGPT", "Claude", "Gemini", "Midjourney", "Any LLM")
- "level": Complexity level — one of "Beginner", "Intermediate", "Advanced"
- "prompt": The fully assembled prompt text, combining all sections into a coherent instruction. Use the Persona as a system-level framing, incorporate Task, Context, Output format, Audience, Step-by-Step instructions, References, and Tonality naturally. Make it clear, specific, and ready to paste into an AI tool.
- "sections": An object with the 8 original section keys and their raw transcribed values

Return ONLY valid JSON, no markdown fences.`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "image (base64 string) is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: VISION_MODEL });

    // Strip data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg",
      },
    };

    // --- Pass 1: Extract handwritten text from each section ---
    const extractionResult = await model.generateContent([
      EXTRACTION_PROMPT,
      imagePart,
    ]);
    const extractionText = extractionResult.response.text().trim();

    let sections: Record<string, string>;
    try {
      sections = JSON.parse(extractionText);
    } catch {
      console.error("Failed to parse extraction response:", extractionText);
      return NextResponse.json(
        { error: "Failed to parse handwriting extraction results" },
        { status: 502 }
      );
    }

    // --- Pass 2: Assemble into a polished prompt card ---
    const assemblyInput = `Here are the extracted sections from the Prompt Canvas:\n\n${JSON.stringify(sections, null, 2)}`;

    const assemblyResult = await model.generateContent([
      ASSEMBLY_PROMPT,
      { text: assemblyInput },
    ]);
    const assemblyText = assemblyResult.response.text().trim();

    let card: {
      title: string;
      tagline: string;
      tool: string;
      level: string;
      prompt: string;
      sections: Record<string, string>;
    };
    try {
      card = JSON.parse(assemblyText);
    } catch {
      console.error("Failed to parse assembly response:", assemblyText);
      return NextResponse.json(
        { error: "Failed to parse assembled prompt card" },
        { status: 502 }
      );
    }

    // Ensure sections from extraction are included even if the assembly model
    // returned its own version
    card.sections = sections;

    return NextResponse.json(card);
  } catch (error: unknown) {
    console.error("Canvas OCR API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process canvas image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
