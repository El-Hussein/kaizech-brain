"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Bot, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Hero() {
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hi! I'm Kaizech, an Agentic AI. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const textToProcess = textOverride || input;
    if (!textToProcess.trim()) return;
    
    setMessages((prev) => [...prev, { role: "user", content: textToProcess }]);
    const currentInput = textToProcess.toLowerCase();
    setInput("");
    
    // Simulate AI typing delay
    setTimeout(async () => {
      let response = "That's a great question! Kaizech Brain's architecture is highly flexible. Check out our documentation or sign up for free to explore all the possibilities!";
      
      try {
        const knowledgeModule = await import("../data/public_knowledge.json");
        const { findBestResponse } = await import("../utils/rag");
        const knowledgeBase = knowledgeModule.default || knowledgeModule;
        
        const bestResponse = findBestResponse(currentInput, knowledgeBase);

        if (bestResponse) {
          response = bestResponse;
        }
      } catch (err) {
        console.error("Failed to load knowledge base:", err);
      }

      setMessages((prev) => [
        ...prev,
        { role: "bot", content: response }
      ]);
    }, 800);
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left: Copy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-6">
              <span>⚡</span>
              <span>The Omnichannel Agentic AI Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Deploy Self-Learning AI Agents Across <span className="gradient-text">WhatsApp & Web</span> in Minutes
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
              Unify your customer experience across WhatsApp, your website, mobile apps, and APIs. Connect your company knowledge and let autonomous, self-improving agents resolve inquiries 24/7.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <Link href="#pricing" className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                Start for Free <ArrowRight size={18} className="ml-2" />
              </Link>
              <Link href="/integration" className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Explore Integrations
              </Link>
            </div>

            {/* Omnichannel Integration Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-10">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Available On:</span>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> WhatsApp
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Web Widget
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> Messenger
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span> Mobile & API
                </span>
              </div>
            </div>
            <div className="mt-10 flex items-center gap-4 text-sm text-slate-500 font-medium">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <p>Trusted by 500+ innovative teams</p>
            </div>
          </motion.div>

          {/* Right: Interactive Widget */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 opacity-20 blur-2xl"></div>
            <div className="relative glass-card rounded-2xl overflow-hidden flex flex-col h-[500px]">
              {/* Widget Header */}
              <div className="px-6 py-4 border-b border-white/20 bg-white/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 leading-tight">Kaizech Assistant</h3>
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Widget Body */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-slate-50/50">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Prompt Chips */}
              <div className="px-4 pb-2 pt-2 bg-white flex gap-2 overflow-x-auto border-t border-slate-100" style={{ scrollbarWidth: 'none' }}>
                {["WhatsApp Integration?", "Pricing Plans", "Data Privacy"].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSend(undefined, chip)}
                    className="whitespace-nowrap px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors border border-indigo-100"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Widget Input */}
              <div className="p-4 bg-white">
                <form onSubmit={handleSend} className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            </div>
            
            {/* Floating Badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -left-12 top-1/4 bg-white p-3 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-3 hidden md:flex"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <MessageSquare size={16} />
              </div>
              <div className="text-sm font-semibold">Live Preview</div>
            </motion.div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
