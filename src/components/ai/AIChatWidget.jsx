import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Loader2,
  TrendingUp,
  Wallet,
  Receipt,
  HelpCircle
} from 'lucide-react';
import api from '../../services/api';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: "👋 Hi! I'm WoltAI, your personal banking assistant. Ask me anything about your finances!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    { icon: Wallet, text: "What's my balance?" },
    { icon: Receipt, text: "Show recent transactions" },
    { icon: TrendingUp, text: "Analyze my spending" },
    { icon: HelpCircle, text: "How do I deposit?" }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // TODO: Replace with actual API endpoint
      const response = await api.post('/api/ai/query', {
        query: userMessage.text,
        context: {
          // Add user context here
        }
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: response.data.response || "I'm processing your request...",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Fallback mock response
      const mockResponse = getMockResponse(userMessage.text);
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: mockResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getMockResponse = (query) => {
    const q = query.toLowerCase();
    
    if (q.includes('balance') || q.includes('money')) {
      return "💰 Your current balance:\n\n• EUR Wallet: €1,234.56\n• USD Wallet: $890.00\n\nTotal: €2,048.12 equivalent";
    }
    
    if (q.includes('transaction') || q.includes('spending')) {
      return "📊 Recent activity:\n\n• €45.20 at Supermarket (Today)\n• €12.50 at Coffee Shop (Yesterday)\n• €89.00 at Gas Station (2 days ago)\n\nTotal this week: €146.70";
    }
    
    if (q.includes('deposit') || q.includes('add money')) {
      return "💳 To deposit money:\n\n1. Click 'Deposit Money' button\n2. Choose payment method (Card/Bank/Crypto)\n3. Enter amount\n4. Complete payment\n\nWant me to open the deposit modal for you?";
    }
    
    if (q.includes('send') || q.includes('transfer')) {
      return "📤 To send money:\n\n1. Click 'Send Money'\n2. Enter recipient (email/phone/IBAN)\n3. Enter amount\n4. Confirm with PIN\n\nCross-border transfers supported!";
    }
    
    return "🤖 I understand you're asking about: \"" + query + "\"\n\nI'm currently learning more about your finances. For specific help, try asking:\n\n• What's my balance?\n• Show my transactions\n• How do I deposit money?\n• Analyze my spending";
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
    handleSend();
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-gold to-gold-dark rounded-full flex items-center justify-center shadow-gold animate-glow"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-7 h-7 text-primary" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="relative"
            >
              <Sparkles className="w-7 h-7 text-primary" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-primary"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[600px] glass-card shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-gold/20 bg-gradient-to-r from-gold/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold to-gold-dark rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-secondary"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg">WoltAI</h3>
                  <p className="text-xs text-gray-400">Your AI Banking Assistant</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    message.type === 'user'
                      ? 'bg-gold text-primary rounded-2xl rounded-br-sm'
                      : 'bg-white/5 text-white rounded-2xl rounded-bl-sm border border-white/10'
                  } px-4 py-3`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    <p className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gold" />
                      <span className="text-sm text-gray-400">WoltAI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 pb-3">
                <p className="text-xs text-gray-400 mb-2 font-semibold">Quick questions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickQuestions.map((q, index) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuickQuestion(q.text)}
                        className="flex items-center gap-2 p-2 bg-white/5 hover:bg-gold/20 border border-white/10 hover:border-gold/30 rounded-lg transition-all text-left text-xs"
                      >
                        <Icon className="w-4 h-4 text-gold flex-shrink-0" />
                        <span className="text-white">{q.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gold/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-gold focus:outline-none transition-all"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="btn-gold px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}