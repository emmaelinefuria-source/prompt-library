import { NextRequest, NextResponse } from "next/server";
import { routeChat } from "@/lib/providers";

export async function POST(req: NextRequest) {
  try {
    const { topic, model } = await req.json();

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { error: "topic is required" },
        { status: 400 }
      );
    }

    const provider = model || "gemini";

    const systemPrompt = `You are an expert research analyst. The user will give you a topic to research. Produce a comprehensive, structured research report.

Your response MUST follow this exact format:

## Research Overview
[2-3 paragraph overview of the topic, its significance, and current landscape]

## Key Findings

### Finding 1: [Title]
[Description with supporting evidence or reasoning]
> "[A relevant quote or key data point]"

### Finding 2: [Title]
[Description with supporting evidence or reasoning]
> "[A relevant quote or key data point]"

### Finding 3: [Title]
[Description with supporting evidence or reasoning]
> "[A relevant quote or key data point]"

### Finding 4: [Title]
[Description with supporting evidence or reasoning]
> "[A relevant quote or key data point]"

### Finding 5: [Title]
[Description with supporting evidence or reasoning]
> "[A relevant quote or key data point]"

### Finding 6: [Title]
[Description with supporting evidence or reasoning]
> "[A relevant quote or key data point]"

## Summary Table

| Aspect | Current State | Trend | Impact |
|--------|--------------|-------|--------|
| [Aspect 1] | [State] | [Up/Down/Stable] | [High/Medium/Low] |
| [Aspect 2] | [State] | [Up/Down/Stable] | [High/Medium/Low] |
| [Aspect 3] | [State] | [Up/Down/Stable] | [High/Medium/Low] |
| [Aspect 4] | [State] | [Up/Down/Stable] | [High/Medium/Low] |
| [Aspect 5] | [State] | [Up/Down/Stable] | [High/Medium/Low] |

## Implications for Design
[3-4 specific, actionable implications for designers and product teams based on the findings above]

Be thorough, specific, and evidence-based. Use real-world examples where possible.`;

    const messages = [
      { role: "user" as const, content: `${systemPrompt}\n\nResearch topic: ${topic.trim()}` },
    ];

    const result = await routeChat(provider, messages);
    return NextResponse.json({ content: result.content });
  } catch (error: unknown) {
    console.error("Research skill error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to run research skill";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
