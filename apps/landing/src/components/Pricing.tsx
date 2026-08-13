"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    description: "Perfect for testing and small projects. Frictionless entry.",
    features: [
      "1 AI Agent",
      "Prompt Builder",
      "Basic Knowledge RAG (3 docs, 10MB)",
      "1 Mock API Tool",
      "100 Conversations / month",
      "Standard Branded Widget"
    ],
    cta: "Start for Free",
    popular: false,
  },
  {
    name: "Professional",
    price: "$49",
    period: "/mo",
    description: "For growing SMBs and SaaS apps requiring advanced logic.",
    features: [
      "Up to 5 AI Agents",
      "Advanced Prompts & Personas",
      "50 Docs + Web Scraping",
      "10 Custom API Tools",
      "10,000 Conversations / month",
      "Unbranded Customizable Widget",
      "Long-term Memory & Rules"
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large-scale, secure multi-tenant operations.",
    features: [
      "Unlimited AI Agents",
      "Unlimited RAG Connectors (SQL, etc.)",
      "Unlimited Custom API Tools",
      "Full White-label & Mobile SDKs",
      "VPC / On-Premise Deployment",
      "SOC2 Compliance",
      "99.99% Uptime SLA"
    ],
    cta: "Contact Sales",
    popular: false,
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3">Transparent Pricing</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Scale your AI without surprises</h3>
          <p className="text-lg text-slate-600">
            Start for free. Upgrade when you need more power, memory, and API integrations.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-3xl bg-white border flex flex-col p-8 ${
                tier.popular 
                  ? 'border-indigo-500 shadow-2xl shadow-indigo-100 scale-105 z-10' 
                  : 'border-slate-200 shadow-xl shadow-slate-100/50'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h4 className="text-xl font-bold text-slate-900 mb-2">{tier.name}</h4>
                <p className="text-slate-500 text-sm h-10">{tier.description}</p>
              </div>
              
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-slate-900">{tier.price}</span>
                {tier.period && <span className="text-slate-500 font-medium">{tier.period}</span>}
              </div>
              
              <Link 
                href={tier.name === 'Enterprise' ? '#contact' : 'https://dashboard.kaizech.com/signup'}
                className={`w-full py-3.5 px-4 rounded-xl text-center font-semibold transition-all mb-8 ${
                  tier.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                    : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tier.cta}
              </Link>
              
              <div className="space-y-4 flex-1">
                {tier.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
