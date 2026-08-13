"use client";

import { motion } from "framer-motion";
import { MessageCircle, BrainCircuit, Code, Search, Settings, ShieldCheck } from "lucide-react";

const services = [
  {
    icon: <MessageCircle size={24} />,
    title: "Automated Customer Support",
    description: "Deploy 24/7 AI agents that understand context, resolve tickets, and seamlessly escalate to human agents when needed."
  },
  {
    icon: <Search size={24} />,
    title: "Enterprise Knowledge RAG",
    description: "Connect your internal docs, databases, and websites. Our agents retrieve precise answers instantly."
  },
  {
    icon: <Code size={24} />,
    title: "Agentic Media Replies",
    description: "Automatically engage with social media mentions and comments using brand-aligned, intelligent responses."
  },
  {
    icon: <Settings size={24} />,
    title: "Custom API Actions",
    description: "Enable agents to trigger real-world actions across your software stack through secure API integrations."
  },
  {
    icon: <BrainCircuit size={24} />,
    title: "Custom Rule Engine",
    description: "Set strict guardrails and memory rules so your AI always behaves exactly according to your business logic."
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Multi-Tenant Isolation",
    description: "Bank-grade security with strict data separation ensures your enterprise data is never leaked or cross-trained."
  }
];

export function Services() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3">Our Services</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to build AI teams</h3>
          <p className="text-lg text-slate-600">
            Kaizech Brain provides a complete toolkit to transition your business into the agentic era. 
            From customer support to internal knowledge retrieval, we have you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-3">{service.title}</h4>
              <p className="text-slate-600 leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
