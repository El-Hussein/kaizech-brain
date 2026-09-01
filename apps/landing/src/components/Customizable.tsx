"use client";

import { motion } from "framer-motion";
import { KeyRound, Sparkles, SlidersHorizontal, Settings2 } from "lucide-react";

const features = [
  {
    icon: <Sparkles className="text-fuchsia-500" size={24} />,
    title: "Self-Learning Intelligence",
    description: "Continuously discovers unanswered questions and refines its responses over time with built-in guardrails and human verification."
  },
  {
    icon: <Settings2 className="text-blue-500" size={24} />,
    title: "Enterprise Guardrails & Personas",
    description: "Define strict tone, hallucination thresholds, and custom prompt guardrails. Keep your AI 100% aligned with your brand guidelines."
  },
  {
    icon: <KeyRound className="text-amber-500" size={24} />,
    title: "Bring Your Own Key (BYOK)",
    description: "Connect your own OpenAI, Anthropic, or HuggingFace API keys. Keep full control over your billing and data privacy."
  },
  {
    icon: <SlidersHorizontal className="text-emerald-500" size={24} />,
    title: "Usage & Rate Limiting",
    description: "Set hard caps on user message limits, daily quotas, and maximum token output to prevent abuse and manage your costs."
  }
];

export function Customizable() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute left-0 top-1/2 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute right-0 bottom-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 translate-x-1/3"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="min-w-0 w-full"
          >
            <h2 className="text-fuchsia-600 font-semibold tracking-wide uppercase text-sm mb-3">Total Control</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">Everything is <br/>100% Customizable</h3>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              We don't lock you into a black box. Kaizech Brain gives you granular control over the engine, the data, and the economics of your AI agents.
            </p>

            <div className="space-y-8">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h4>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Code/Dashboard Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative min-w-0 w-full"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-100 to-blue-100 rounded-3xl transform rotate-3 opacity-50"></div>
            
            <div className="relative h-[400px] sm:h-[500px] w-full">
              {/* Back Image (FAQ Settings) */}
              <img 
                src="/faq-settings.png" 
                alt="FAQ Settings Control" 
                className="absolute top-4 right-0 w-[85%] rounded-xl shadow-2xl border border-slate-700/20 transform rotate-3 hover:rotate-0 hover:scale-105 hover:z-30 transition-all duration-300"
              />

              {/* Front Image (Handoff Settings) */}
              <img 
                src="/handoff-settings.png" 
                alt="Handoff Settings Control" 
                className="absolute bottom-12 left-0 w-[85%] rounded-xl shadow-2xl border border-slate-700/20 transform -rotate-3 hover:rotate-0 hover:scale-105 hover:z-30 transition-all duration-300 z-20"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
