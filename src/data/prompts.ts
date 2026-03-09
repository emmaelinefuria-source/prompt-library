export interface PromptCard {
  id: string;
  title: string;
  category: string;
  emoji: string;
  description: string;
  prompt: string;
}

export const prompts: PromptCard[] = [
  {
    id: "write-email",
    title: "Write a Professional Email",
    category: "Writing",
    emoji: "✉️",
    description: "Get help drafting a clear, professional email for any situation.",
    prompt:
      "Help me write a professional email. Here's the context: [describe the situation, who you're emailing, and what you need]. Please make it polite, clear, and concise.",
  },
  {
    id: "explain-concept",
    title: "Explain Like I'm 5",
    category: "Learning",
    emoji: "🧒",
    description: "Get any complex topic explained in simple, easy-to-understand language.",
    prompt:
      "Explain [topic] to me like I'm 5 years old. Use simple words, fun examples, and analogies I can relate to.",
  },
  {
    id: "brainstorm",
    title: "Brainstorm Ideas",
    category: "Creativity",
    emoji: "💡",
    description: "Generate creative ideas for any project, problem, or goal.",
    prompt:
      "I need creative ideas for [describe your project or problem]. Give me 10 unique suggestions with a brief explanation for each.",
  },
  {
    id: "summarize",
    title: "Summarize Text",
    category: "Productivity",
    emoji: "📝",
    description: "Get a quick summary of any long text, article, or document.",
    prompt:
      "Summarize the following text in 3-5 bullet points, highlighting the key takeaways:\n\n[paste your text here]",
  },
  {
    id: "debug-help",
    title: "Fix My Code",
    category: "Tech",
    emoji: "🐛",
    description: "Get help finding and fixing bugs in your code.",
    prompt:
      "I have a bug in my code. Here's what's happening: [describe the problem]. Here's my code:\n\n[paste code here]\n\nPlease find the bug, explain what went wrong, and give me the fixed version.",
  },
  {
    id: "meal-plan",
    title: "Plan My Meals",
    category: "Lifestyle",
    emoji: "🍽️",
    description: "Get a personalized meal plan based on your preferences.",
    prompt:
      "Create a meal plan for [number] days. My dietary preferences are: [list any restrictions or preferences]. I want meals that are [easy/quick/healthy/budget-friendly]. Include a shopping list.",
  },
  {
    id: "study-guide",
    title: "Create a Study Guide",
    category: "Learning",
    emoji: "📚",
    description: "Turn any topic into an organized study guide with key points.",
    prompt:
      "Create a comprehensive study guide for [topic/subject]. Include key concepts, definitions, examples, and practice questions. Organize it in a clear, easy-to-follow structure.",
  },
  {
    id: "social-media",
    title: "Write a Social Post",
    category: "Writing",
    emoji: "📱",
    description: "Create engaging social media content for any platform.",
    prompt:
      "Write a [platform: Instagram/Twitter/LinkedIn] post about [topic]. Make it engaging, include relevant hashtags, and match the tone of [casual/professional/fun]. Keep it within the character limit.",
  },
  {
    id: "pros-cons",
    title: "Pros & Cons Analysis",
    category: "Productivity",
    emoji: "⚖️",
    description: "Get a balanced analysis to help you make better decisions.",
    prompt:
      "I'm trying to decide between [option A] and [option B]. Give me a detailed pros and cons list for each, and then give me your recommendation based on the analysis.",
  },
  {
    id: "cover-letter",
    title: "Write a Cover Letter",
    category: "Career",
    emoji: "💼",
    description: "Generate a compelling cover letter tailored to any job.",
    prompt:
      "Write a cover letter for the position of [job title] at [company]. My key qualifications are: [list 3-5 skills/experiences]. Make it enthusiastic but professional, and tailor it to the role.",
  },
  {
    id: "workout",
    title: "Create a Workout Plan",
    category: "Lifestyle",
    emoji: "💪",
    description: "Get a personalized exercise routine based on your goals.",
    prompt:
      "Create a [number]-day workout plan for someone who is [beginner/intermediate/advanced]. My goal is [lose weight/build muscle/improve cardio/general fitness]. I have access to [gym/home equipment/no equipment]. Each workout should take about [time] minutes.",
  },
  {
    id: "translate-tone",
    title: "Change the Tone",
    category: "Writing",
    emoji: "🎭",
    description: "Rewrite any text in a different tone or style.",
    prompt:
      "Rewrite the following text to sound more [formal/casual/friendly/persuasive/humorous]:\n\n[paste your text here]",
  },
];

export function getPromptById(id: string): PromptCard | undefined {
  return prompts.find((p) => p.id === id);
}
