"use client";

import { motion } from "framer-motion";
import { KeyRound, Sparkles, SlidersHorizontal, Settings2 } from "lucide-react";

const features = [
  {
    icon: <KeyRound className="text-amber-500" size={24} />,
    title: "Bring Your Own Key (BYOK)",
    description: "Connect your own OpenAI, Anthropic, or HuggingFace API keys. Keep full control over your billing and data privacy."
  },
  {
    icon: <Sparkles className="text-fuchsia-500" size={24} />,
    title: "Model Selection",
    description: "Switch seamlessly between GPT-4o, Claude 3.5 Sonnet, or open-source models depending on your cost and intelligence requirements."
  },
  {
    icon: <Settings2 className="text-blue-500" size={24} />,
    title: "Custom RAG Rules",
    description: "Define strict hallucination thresholds. Tell your agent to exclusively use uploaded PDFs, or allow it to fall back to general knowledge."
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
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-100 to-blue-100 rounded-3xl transform rotate-3"></div>
            <div className="relative bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="font-semibold text-slate-700 text-sm">Agent Settings</div>
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200"></div><div className="w-3 h-3 rounded-full bg-slate-200"></div></div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">AI Model</span>
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">gpt-4o-mini</span>
                  </div>
                  <div className="h-10 bg-slate-50 border border-slate-200 rounded-lg"></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">Strict RAG Mode</span>
                    <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Only answer using uploaded documents.</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">Temperature</span>
                    <span className="text-slate-500">0.2</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full relative">
                    <div className="absolute left-0 top-0 h-full w-1/5 bg-indigo-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
