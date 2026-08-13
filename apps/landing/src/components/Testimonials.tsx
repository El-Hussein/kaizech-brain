"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Kaizech Brain completely transformed our support workflow. The AI resolves 70% of tickets instantly, and our CSAT score is the highest it's ever been.",
    author: "Sarah Jenkins",
    role: "Head of Support, TechFlow",
    avatar: "https://i.pravatar.cc/150?img=47"
  },
  {
    quote: "The ability to securely connect our proprietary Postgres database to the RAG pipeline in under 10 minutes was mind-blowing. Enterprise grade indeed.",
    author: "David Chen",
    role: "CTO, DataSync",
    avatar: "https://i.pravatar.cc/150?img=11"
  },
  {
    quote: "We deployed a social media reply agent using Kaizech. It perfectly matches our brand voice and has increased our engagement by 300%.",
    author: "Elena Rodriguez",
    role: "Marketing Director, Bloom",
    avatar: "https://i.pravatar.cc/150?img=5"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3">Customer Feedback</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Don't just take our word for it</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((test, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col"
            >
              <div className="flex gap-1 mb-6 text-amber-400">
                {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <blockquote className="text-slate-700 text-lg mb-8 flex-1 italic">
                "{test.quote}"
              </blockquote>
              <div className="flex items-center gap-4">
                <img src={test.avatar} alt={test.author} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                <div>
                  <div className="font-bold text-slate-900">{test.author}</div>
                  <div className="text-sm text-slate-500">{test.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
