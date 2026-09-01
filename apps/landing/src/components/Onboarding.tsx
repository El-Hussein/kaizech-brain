"use client";

import { motion } from "framer-motion";
import { Mic, Sparkles, CheckCircle2 } from "lucide-react";

export function Onboarding() {
  return (
    <section id="onboarding" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 text-cyan-700 font-medium text-sm mb-6 border border-cyan-100">
              <Mic className="w-4 h-4" />
              <span>Voice-Guided Setup</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Skip the forms.<br/>Just start speaking.
            </h2>
            
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              We've completely reimagined the onboarding experience. No more complex configurations, tedious forms, or endless settings panels. Just answer a few simple questions about your business, naturally.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                "Tap the microphone and speak naturally",
                "Automatic transcriptions in multiple languages",
                "We instantly extract your business context",
                "Your AI Agent is fully configured in minutes"
              ].map((item, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 text-slate-700 font-medium"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative order-1 lg:order-2"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-indigo-400 rounded-3xl blur-3xl opacity-20 transform rotate-3"></div>
            <div className="relative rounded-2xl md:rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur-sm p-2 md:p-4 shadow-2xl">
              <img 
                src="/voice-onboarding.png" 
                alt="Voice Onboarding UI" 
                className="w-full h-auto rounded-xl md:rounded-2xl border border-slate-100 shadow-sm"
              />
            </div>
            
            {/* Floating badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute -bottom-6 -left-6 md:-bottom-8 md:-left-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 z-20 hidden sm:flex"
            >
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Zero Setup</p>
                <p className="text-lg font-bold text-slate-900">100% Automated</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
