"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Code, Terminal, CheckCircle, Smartphone, Globe } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntegrationPage() {
  const [activeTab, setActiveTab] = useState<"web" | "whatsapp" | "api">("web");

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Integration Guide</h1>
            <p className="text-lg text-slate-600">
              Deploy your agents anywhere. Seamlessly connect Kaizech Brain to your website, WhatsApp, or custom applications.
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-10 overflow-x-auto pb-4">
            <button 
              onClick={() => setActiveTab("web")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${activeTab === 'web' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
            >
              <Globe size={18} /> Web Widget
            </button>
            <button 
              onClick={() => setActiveTab("whatsapp")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${activeTab === 'whatsapp' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
            >
              <Smartphone size={18} /> WhatsApp
            </button>
            <button 
              onClick={() => setActiveTab("api")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${activeTab === 'api' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
            >
              <Terminal size={18} /> REST API
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 md:p-12">
              <AnimatePresence mode="wait">
                
                {activeTab === "web" && (
                  <motion.div
                    key="web"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex gap-4 items-start mb-10">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">1</div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Get your API keys</h3>
                        <p className="text-slate-600 mb-4">Navigate to <strong>Settings & API Keys</strong>, and copy your public Widget Key.</p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-flex items-center gap-3">
                          <CheckCircle className="text-emerald-500" size={20} />
                          <code className="text-sm text-slate-700">kb_live_pk_xxxxxxxxxxxxx</code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">2</div>
                      <div className="w-full">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Add the Script</h3>
                        <p className="text-slate-600 mb-4">Place this script tag right before the closing <code>&lt;/body&gt;</code> tag of your HTML.</p>
                        <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-inner">
                          <div className="flex items-center px-4 py-2 bg-black/40 border-b border-white/10">
                            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500"></div><div className="w-3 h-3 rounded-full bg-amber-500"></div><div className="w-3 h-3 rounded-full bg-emerald-500"></div></div>
                            <div className="ml-4 text-xs text-slate-400 font-mono">index.html</div>
                          </div>
                          <pre className="p-4 overflow-x-auto">
                            <code className="text-sm text-blue-300 font-mono">
{`<script 
  src="https://cdn.kaizech.com/widget.js" 
  data-client-id="YOUR_WIDGET_KEY"
  data-theme="light"
  defer
></script>`}
                            </code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "whatsapp" && (
                  <motion.div
                    key="whatsapp"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex gap-4 items-start mb-10">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">1</div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Configure Meta Webhook</h3>
                        <p className="text-slate-600 mb-4">In your Meta Developer account, configure your WhatsApp webhook to point to our secure ingestion endpoint.</p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <code className="text-sm text-slate-700 font-mono break-all">https://api.kaizech.com/v1/webhooks/whatsapp/YOUR_AGENT_ID</code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">2</div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Verify Webhook Token</h3>
                        <p className="text-slate-600 mb-4">Copy the verification token generated in the Kaizech dashboard and paste it into Meta to verify the callback.</p>
                        <p className="text-sm text-slate-500 italic">Once verified, any incoming WhatsApp message will automatically trigger your Kaizech Agent and send the reply back!</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "api" && (
                  <motion.div
                    key="api"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Direct REST API Integration</h3>
                      <p className="text-slate-600">Bypass the UI widgets and chat directly with your configured agents. Useful for custom mobile apps or backend workflows.</p>
                    </div>

                    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-inner">
                      <div className="flex items-center px-4 py-2 bg-black/40 border-b border-white/10">
                        <div className="ml-4 text-xs text-slate-400 font-mono">cURL</div>
                      </div>
                      <pre className="p-4 overflow-x-auto">
                        <code className="text-sm text-emerald-300 font-mono">
{`curl -X POST https://api.kaizech.com/v1/chat/completions \\
  -H "Authorization: Bearer kb_live_sk_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "agt_12345",
    "messages": [
      {"role": "user", "content": "How do I reset my password?"}
    ]
  }'`}
                        </code>
                      </pre>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
            
            <div className="bg-indigo-50 p-8 border-t border-indigo-100 text-center">
              <h4 className="font-semibold text-indigo-900 mb-2">Building a custom React/Next.js UI?</h4>
              <p className="text-indigo-700 text-sm mb-4">Use our headless NPM package instead.</p>
              <code className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-indigo-200 text-sm text-indigo-600 font-mono shadow-sm">
                <Terminal size={16} /> npm install @kaizech/react
              </code>
            </div>
          </div>
          
        </div>
      </main>
      <Footer />
    </>
  );
}
