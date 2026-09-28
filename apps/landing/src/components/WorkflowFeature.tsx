"use client";

import { motion } from "framer-motion";
import { GitMerge, Code2, Network, Zap } from "lucide-react";

export function WorkflowFeature() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="min-w-0 w-full"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium text-sm mb-6">
              <GitMerge size={16} />
              <span>New Feature</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">Kaizech FlowStudio™</h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Move beyond unpredictable AI generation. Design deterministic, conditional conversational journeys that guide users exactly where they need to go, powered by our dynamic JSON workflow engine.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Network size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Deterministic Routing</h4>
                  <p className="text-slate-600 text-sm mt-1">Force the conversation down structured paths with interactive buttons and lists when specific keywords are matched.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Native API Integrations</h4>
                  <p className="text-slate-600 text-sm mt-1">Fetch live data mid-conversation, populate buttons dynamically, and conditionally render messages based on real-time API responses.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center shrink-0">
                  <Code2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Dynamic Context Memory</h4>
                  <p className="text-slate-600 text-sm mt-1">Store user selections in session context and inject them as placeholders in subsequent API calls and messages.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative min-w-0 w-full"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl transform rotate-2 opacity-20 blur-xl"></div>
            
            <div className="relative bg-[#0e1422] rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-[#0a0f1a]">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-400 text-xs ml-2 font-mono">workflow.json</span>
              </div>
              <div className="p-6 overflow-x-auto text-sm font-mono leading-relaxed">
                <pre><code className="text-emerald-400">
{`[
  {
    "id": "fetch_products",
    "type": "api_fetch",
    "endpoint": "/api/catalog?category={{context.category}}",
    "dataPath": "data.items",
    "message": "Here are our latest products:\\n{{#if data.isSale}}🔥 Special discount applied!{{/if}}",
    "displayType": "list",
    "payloadField": "sku",
    "onSelectNextNode": "checkout_step"
  }
]`}
                </code></pre>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
