async function test() {
  const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY || '';
  
  const payload = {
    model: 'llama-3.1-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hi' }
    ],
    temperature: 0.7,
    max_tokens: 1024,
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('API ERROR:', err);
    } else {
      const data = await response.json();
      console.log('SUCCESS:', data.choices[0].message.content);
    }
  } catch (error) {
    console.error('NETWORK ERROR:', error.message);
  }
}
test();
