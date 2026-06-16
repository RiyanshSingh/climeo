export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callGroqDirectly(
  messages: { role: string; content: string }[],
  temperature = 0.7,
  maxTokens = 1024
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('No Groq API key available');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq Direct Error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}

export async function chatWithCoach(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];

  // 1. Try the Flask proxy first (works in local dev)
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.content) return data.content as string;
    }
  } catch {
    // Flask proxy not available — fall through to direct call
  }

  // 2. Fallback: call Groq directly from the browser
  return callGroqDirectly(fullMessages, 0.7, 1024);
}

export async function getEcoRecommendations(userHabits: string): Promise<string[]> {
  const systemPrompt =
    'You are a sustainability expert. Based on the user\'s answers, ' +
    'output exactly 3 short, highly actionable, and tailored recommendations. ' +
    'Format as a raw JSON array of strings (e.g. ["Rec 1", "Rec 2", "Rec 3"]). ' +
    'Return ONLY the JSON array, no extra text, no markdown codeblocks, no formatting.';

  // 1. Try Flask proxy
  try {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userHabits }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.recommendations?.length) return data.recommendations as string[];
    }
  } catch {
    // Fall through
  }

  // 2. Fallback: direct Groq call
  try {
    const raw = await callGroqDirectly(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userHabits },
      ],
      0.5,
      300
    );
    const match = raw.match(/\[.*\]/s);
    if (match) return JSON.parse(match[0]) as string[];
  } catch (err) {
    console.error('Error fetching recommendations:', err);
  }

  return [];
}
