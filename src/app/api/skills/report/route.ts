import { NextRequest, NextResponse } from "next/server";
import { routeChat } from "@/lib/providers";

export async function POST(req: NextRequest) {
  try {
    const { content, model } = await req.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const provider = model || "gemini";

    const systemPrompt = `You are an expert report writer. The user will provide raw content (research notes, findings, data, etc.). Your job is to transform it into a polished, well-structured report.

Your response MUST follow this format:

# Executive Summary
[2-3 sentence summary of the most important takeaways]

# Background & Context
[Set the stage for the reader - why this matters]

# Key Findings

## 1. [Finding Title]
[Detailed explanation with evidence]

## 2. [Finding Title]
[Detailed explanation with evidence]

## 3. [Finding Title]
[Detailed explanation with evidence]

## 4. [Finding Title]
[Detailed explanation with evidence]

# Analysis
[Cross-cutting analysis that connects the findings together]

# Recommendations
1. **[Recommendation]**: [Why and how]
2. **[Recommendation]**: [Why and how]
3. **[Recommendation]**: [Why and how]

# Next Steps
- [ ] [Action item 1]
- [ ] [Action item 2]
- [ ] [Action item 3]

Write clearly, professionally, and with actionable detail. Structure for easy scanning.`;

    const messages = [
      { role: "user" as const, content: `${systemPrompt}\n\nContent to format as a report:\n\n${content.trim()}` },
    ];

    const result = await routeChat(provider, messages);
    return NextResponse.json({ content: result.content });
  } catch (error: unknown) {
    console.error("Report skill error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to run report skill";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
