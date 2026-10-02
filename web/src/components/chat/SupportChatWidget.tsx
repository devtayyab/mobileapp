'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Mail,
  Minimize2,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/providers/LanguageProvider';
import { cn } from '@/lib/cn';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  link?: { href: string; label: string };
}

const FAQ_KNOWLEDGE_BASE = [
  {
    keywords: ['payment', 'pay', 'card', 'visa', 'mastercard', 'stripe', 'apple pay', 'google pay'],
    answer:
      'We accept Visa, Mastercard, American Express, Apple Pay, Google Pay, and Stripe. All payments are encrypted with 256-bit SSL and processed with PCI Level 1 security.',
    link: { href: '/payments', label: 'View Payment Guide & FAQs' },
  },
  {
    keywords: ['order', 'track', 'tracking', 'status', 'delivery', 'ship', 'shipping'],
    answer:
      'You can track your orders in real-time under your Account -> Orders page. Worldwide shipping is handled by verified supplier carriers with tracking codes provided upon dispatch.',
    link: { href: '/orders', label: 'Go to Order Tracking' },
  },
  {
    keywords: ['refund', 'return', 'cancel', 'policy', 'money back', '14'],
    answer:
      'We offer an EU-compliant 14-day return and refund protection on eligible products. If your item is damaged or does not match specifications, you can open a dispute or refund request.',
    link: { href: '/terms', label: 'Read Returns & Refund Policy' },
  },
  {
    keywords: ['supplier', 'seller', 'vendor', 'sell', 'kyc', 'register as supplier', 'onboarding'],
    answer:
      'Suppliers can register with 0 onboarding fees! Simply submit your business registration, government ID, and bank details in the Supplier Portal for automated verification.',
    link: { href: '/register', label: 'Register as Supplier' },
  },
  {
    keywords: ['wholesale', 'b2b', 'bulk', 'moq', 'volume', 'discount'],
    answer:
      'Verified wholesale accounts unlock direct tiered B2B pricing with volume discounts and customizable MOQ orders directly from manufacturers.',
    link: { href: '/registration', label: 'Learn About B2B Wholesale' },
  },
  {
    keywords: ['contact', 'email', 'support', 'owner', 'phone', 'help', 'sunita', 'shahi', 'takuri'],
    answer:
      'Official support email is shahisunita264@gmail.com. Operated by Sunita Shahi (Takuri Brand, Cyprus) for the Sathun Global Marketplace (sathunglobal.com).',
    link: { href: '/contact', label: 'Contact Support Desk' },
  },
  {
    keywords: ['currency', 'currencies', 'euro', 'dollar', 'pkr', 'npr', 'exchange'],
    answer:
      'We support over 20 international currencies with real-time conversion. You can switch your preferred currency anytime from the top navigation bar.',
  },
];

const QUICK_SUGGESTIONS = [
  'How do payments work?',
  'How to track my order?',
  'What is the refund policy?',
  'How to become a supplier?',
  'What is your support email?',
];

export function SupportChatWidget() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: 'Hello! Welcome to Sathun Global Marketplace Support. How can we assist you today? Ask about orders, shipping, payment methods, supplier registration, or returns.',
      time: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate smart automated response
    setTimeout(() => {
      const lower = query.toLowerCase();
      let matched = FAQ_KNOWLEDGE_BASE.find((faq) =>
        faq.keywords.some((kw) => lower.includes(kw))
      );

      let botResponse: ChatMessage;

      if (matched) {
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: matched.answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          link: matched.link,
        };
      } else {
        // Fallback confirmation message as specified in requirement #7
        botResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'We have received your message and are looking into it. Our support team has logged your inquiry and will follow up shortly at your registered email. For immediate help, contact us directly at shahisunita264@gmail.com.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          link: { href: 'mailto:shahisunita264@gmail.com', label: 'Email Support Directly' },
        };
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <aside aria-label="Customer Support Chat" className="fixed bottom-5 right-5 z-40">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-dark text-white shadow-glow transition-transform"
          aria-label="Open support chat"
        >
          <MessageSquare size={24} />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-secondary" />
          </span>
        </motion.button>
      )}

      {/* Interactive Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="flex h-[520px] w-[370px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-3xl border border-edge bg-surface shadow-glow"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-edge bg-surface-page/80 px-4 py-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot size={22} />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-content-primary">
                    Sathun Support Chat
                  </h3>
                  <p className="flex items-center gap-1 text-2xs font-semibold text-success">
                    <span>●</span> Automated Instant Help
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-content-tertiary transition-colors hover:bg-surface hover:text-content-primary"
                  aria-label="Close support chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'flex flex-col',
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-xs',
                      m.sender === 'user'
                        ? 'bg-primary text-white rounded-br-xs'
                        : 'border border-edge bg-surface-page text-content-primary rounded-bl-xs'
                    )}
                  >
                    <p>{m.text}</p>
                    {m.link && (
                      <div className="mt-2 pt-1.5 border-t border-edge/60">
                        {m.link.href.startsWith('mailto:') ? (
                          <a
                            href={m.link.href}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                          >
                            <Mail size={12} />
                            <span>{m.link.label}</span>
                          </a>
                        ) : (
                          <Link
                            href={m.link.href}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                          >
                            <span>{m.link.label}</span>
                            <ExternalLink size={11} />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="mt-1 px-1 text-3xs text-content-tertiary">
                    {m.time}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 text-content-tertiary text-xs py-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                  <span className="text-2xs ml-1 font-semibold">Sathun Bot is typing…</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="border-t border-edge/60 bg-surface-page/40 p-2.5">
              <p className="text-3xs font-bold uppercase tracking-wider text-content-tertiary mb-1.5">
                Suggested Questions
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_SUGGESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="shrink-0 rounded-full border border-edge bg-surface px-2.5 py-1 text-2xs font-semibold text-content-secondary hover:border-primary hover:text-primary transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 border-t border-edge bg-surface p-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about orders, payments, refunds..."
                className="flex-1 rounded-xl border border-edge bg-surface-page px-3 py-2 text-xs text-content-primary placeholder:text-content-tertiary focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-xs transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
