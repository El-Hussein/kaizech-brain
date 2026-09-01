"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, Clock, Users, DollarSign } from "lucide-react";

export function Impact() {
  const [supportTickets, setSupportTickets] = useState(1000);
  const costPerTicket = 5; // $5 average human cost

  const aiResolutionRate = 0.65; // 65% resolved by AI
  const savedTickets = Math.floor(supportTickets * aiResolutionRate);
  const moneySaved = savedTickets * costPerTicket;

  return (
    <section className="py-24 bg-indigo-900 text-white overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/3 -translate-y-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="min-w-0 w-full"
          >
            <h2 className="text-cyan-400 font-semibold tracking-wide uppercase text-sm mb-3">Measurable Impact</h2>
            <h3 className="text-3xl md:text-5xl font-bold mb-6">Cut costs, not quality</h3>
            <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
              Agentic AI isn't just a gimmick. It directly reduces operational overhead while providing instant, high-quality responses to your users. See the potential ROI for your business.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                <div className="text-cyan-400 mb-2"><Clock size={24} /></div>
                <div className="text-3xl font-bold mb-1">98%</div>
                <div className="text-indigo-200 text-sm">Faster response time</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                <div className="text-cyan-400 mb-2"><Users size={24} /></div>
                <div className="text-3xl font-bold mb-1">24/7</div>
                <div className="text-indigo-200 text-sm">Always-on support</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-white shadow-2xl text-slate-900 min-w-0 w-full"
          >
            <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" /> ROI Calculator
            </h4>

            <div className="mb-8">
              <label className="flex justify-between text-sm font-semibold text-slate-700 mb-4">
                <span>Monthly Support Tickets</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{supportTickets.toLocaleString()}</span>
              </label>
              <input 
                type="range" 
                min="100" 
                max="10000" 
                step="100"
                value={supportTickets}
                onChange={(e) => setSupportTickets(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>100</span>
                <span>10,000+</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-sm font-medium text-slate-600">Tickets Resolved by AI (65%)</div>
                <div className="text-lg font-bold text-slate-900">{savedTickets.toLocaleString()}</div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <DollarSign size={18} /> Estimated Monthly Savings
                </div>
                <div className="text-2xl font-black text-emerald-600">${moneySaved.toLocaleString()}</div>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mt-6 text-center">
              *Based on an industry average of $5 cost per human-handled ticket.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
