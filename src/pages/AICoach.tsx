import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatWithCoach, type ChatMessage } from '../lib/groq';
import { useAppContext } from '../context/AppContext';

export default function AICoach() {
  const navigate = useNavigate();
  const { profile, activities } = useAppContext();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "I am Climeo your personalized coach. How can I help you reduce your footprint today?\nSUGGESTIONS: How can I reduce my footprint this week? | Review my recent activities. | Suggest a new eco goal for me! | How is my Eco Score calculated? | What's the best way to save energy at home?" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim()) return;
    
    const userMessage = textToSend.trim();
    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const recentActivitiesText = activities.slice(0, 3).map(a => `- ${a.title} (-${a.co2Saved}kg CO2)`).join('\n');
      const systemPrompt = `You are "EcoPulse Coach", a friendly, warm, and highly intelligent sustainability expert.
Keep responses brief and conversational (max 2-3 short sentences). Be highly encouraging. 
CRITICAL: DO NOT use any markdown formatting. No asterisks (**), no hashtags (###), just plain text.

CONTEXT:
User: ${profile?.name?.split(' ')[0] || 'User'} | Score: ${profile?.ecoScore || 0} | Saved: ${profile?.totalCO2Saved || 0}kg CO2 | Streak: ${profile?.streak || 0} days
Goals: ${profile?.goals?.join(', ') || 'None'}
Recent:
${recentActivitiesText || 'None'}

Be direct, warm, and highly tailored to this data.

VERY IMPORTANT: At the very end of EVERY response, you MUST provide 5 short, highly relevant follow-up questions the user could ask you next based on the current conversation.
You MUST format these exactly like this on a new line:
SUGGESTIONS: Question 1 | Question 2 | Question 3 | Question 4 | Question 5`;

      // Limit history to the last 6 messages to save tokens
      const tokenOptimizedHistory = updatedMessages.slice(-6);
      
      const aiResponseContent = await chatWithCoach(tokenOptimizedHistory, systemPrompt);

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponseContent }]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Oops, I'm having a little trouble connecting to my brain right now. Error details: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      
      {/* Transparent Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between relative z-10 bg-transparent">
        <button 
          onClick={() => navigate('/')} 
          aria-label="Go back to dashboard"
          className="bg-white/50 p-2.5 rounded-full backdrop-blur-md shadow-sm border border-white hover:bg-white/80 active:scale-95 transition-all focus:outline-none cursor-pointer flex justify-center items-center text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[17px] font-bold text-gray-900 tracking-wide">Eco Coach</h2>
        <div className="w-10"></div> {/* Spacer to balance the back button */}
      </div>

      {/* Chat Area (Scrolls full height) */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24 space-y-4 scrollbar-hide">
        {messages.map((msg, idx) => {
          const parts = msg.content.split('SUGGESTIONS:');
          const text = (parts[0] || '').trim();
          const suggestions = parts.length > 1 ? (parts[1] || '').split('|').map(s => s.trim()).filter(s => s.length > 0) : [];
          const isLastMessage = idx === messages.length - 1;

          return (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2.5`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-eco-green flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="max-w-[80%] flex flex-col gap-2">
                <div 
                  className={`px-4 py-3 rounded-[20px] shadow-sm text-[15px] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-eco-green text-white rounded-tr-sm' 
                      : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{text}</p>
                </div>
                
                {/* Inline Suggestions (only for assistant and only if it's the latest message) */}
                {msg.role === 'assistant' && suggestions.length > 0 && isLastMessage && !loading && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="text-[13px] text-eco-green bg-white hover:bg-eco-green-light border border-eco-green/20 px-3 py-1.5 rounded-full font-medium shadow-sm transition-all active:scale-95 text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div className="flex justify-start gap-2.5">
             <div className="w-8 h-8 rounded-full bg-eco-green shrink-0 flex justify-center items-center text-white mt-auto shadow-sm">
                <Bot size={18} />
              </div>
             <div className="bg-white/85 border border-white/50 rounded-[20px] rounded-bl-sm px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex items-center gap-1.5 h-[46px] backdrop-blur-md">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Glass Input Area */}
      <div className="absolute bottom-6 left-4 right-4 z-[90] bg-white/70 backdrop-blur-xl border border-white/50 rounded-[24px] shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-2">
        <div className="flex items-end gap-2 bg-white/30 rounded-[20px] p-1.5 pl-3 border border-transparent focus-within:border-eco-green/30 focus-within:bg-white/80 transition-colors">
          <textarea 
            id="chat-message-input"
            aria-label="Message Eco Coach"
            rows={1}
            placeholder="Message Eco Coach..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-[15px] text-gray-900 placeholder:text-gray-500 resize-none py-2 max-h-[100px] overflow-y-auto"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className={`w-9 h-9 rounded-full flex justify-center items-center shrink-0 mb-0.5 transition-all duration-200 ${!input.trim() || loading ? 'bg-gray-300/50 text-gray-400' : 'bg-eco-green hover:bg-eco-green-dark text-white shadow-md active:scale-95'}`}
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
