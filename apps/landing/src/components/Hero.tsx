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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    const currentInput = input.toLowerCase();
    setInput("");
    
    // Simulate AI typing delay
    setTimeout(() => {
      let response = "I can help with that! Kaizech Brain empowers you to automate workflows and deploy intelligent agents in minutes.";
      
      if (currentInput.includes("what is") || currentInput.includes("about")) {
        response = "Kaizech Brain is an Agentic AI platform. We provide an end-to-end multi-tenant architecture for businesses to build, deploy, and manage AI agents, Knowledge RAG pipelines, and smart widgets!";
      } else if (currentInput.includes("plan") || currentInput.includes("price") || currentInput.includes("cost") || currentInput.includes("package")) {
        response = "We offer 3 straightforward plans: A free Starter plan to build your first agent, a Professional plan ($49/mo) with advanced integrations, and a Custom Enterprise plan for massive scale and SLA guarantees.";
      } else if (currentInput.includes("whatsapp")) {
        response = "Yes, absolutely! Kaizech Brain has native WhatsApp Business integration. You can connect your number in minutes, set up automated routing, and let your AI agent handle customer inquiries directly on WhatsApp 24/7.";
      } else if (currentInput.includes("integrate") || currentInput.includes("how to") || currentInput.includes("api") || currentInput.includes("system")) {
        response = "Integration is a breeze! You can embed our web widget with a single line of JavaScript, or hit our REST APIs directly to connect with any existing CRM, ERP, or internal system. We have webhooks and SDKs available.";
      } else if (currentInput.includes("rag") || currentInput.includes("data") || currentInput.includes("knowledge")) {
        response = "We support advanced RAG (Retrieval-Augmented Generation). You can upload PDFs, connect SQL databases, or scrape your website. The agent will ground its answers entirely on your proprietary data securely.";
      } else if (currentInput.includes("support") || currentInput.includes("feature")) {
        response = "We support custom RAG, advanced Prompt Building, custom API actions, BYOK (Bring Your Own Key), and multi-tenant security isolation out of the box.";
      } else if (currentInput.includes("hello") || currentInput.includes("hi") || currentInput.includes("hey")) {
        response = "Hello there! Feel free to ask me anything about Kaizech Brain's features, integrations, pricing, or how to get started.";
      } else {
        response = "That's a great question! Kaizech Brain's architecture is highly flexible. Check out our documentation or sign up for free to explore all the possibilities!";
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
              <Zap size={16} />
              <span>The Next Evolution of AI Agents</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Empower your business with <span className="gradient-text">Agentic AI</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
              Deploy intelligent, context-aware agents in minutes. Connect your knowledge base, automate customer support, and seamlessly embed AI anywhere.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="#pricing" className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                Start for Free <ArrowRight size={18} className="ml-2" />
              </Link>
              <Link href="/integration" className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                View Documentation
              </Link>
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
              
              {/* Widget Input */}
              <div className="p-4 bg-white border-t border-slate-100">
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
