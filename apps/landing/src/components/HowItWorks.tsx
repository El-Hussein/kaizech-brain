"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Database, Bot, Play, Beaker, FileText, CheckCircle2, Settings2, SlidersHorizontal, MessageSquare, Terminal, Smartphone } from "lucide-react";

const steps = [
  {
    title: "1. Connect Knowledge",
    description: "Upload your PDFs, link your website, or securely connect your proprietary databases. Kaizech processes and indexes your data instantly.",
    color: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-50",
    visual: (
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <img src="/connect-knowledge.png" alt="Connect Knowledge UI" className="w-full h-full object-cover object-left-top opacity-95" />
      </div>
    )
  },
  {
    title: "2. Configure Agent",
    description: "Define the agent's persona, set behavioral rules, and attach custom API tools using our intuitive visual Prompt Builder.",
    color: "from-cyan-500 to-cyan-600",
    bg: "bg-cyan-50",
    visual: (
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <img src="/configure-agent.png" alt="Configure Agent UI" className="w-full h-full object-cover object-left-top opacity-95" />
      </div>
    )
  },
  {
    title: "3. Test in Playground",
    description: "Before going live, interact with your agent in our sandbox. Test edge cases, refine instructions, and ensure perfect behavior.",
    color: "from-fuchsia-500 to-fuchsia-600",
    bg: "bg-fuchsia-50",
    visual: (
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <img src="/chat-debugger.png" alt="Chat Debugger UI" className="w-full h-full object-cover object-left-top opacity-95" />
      </div>
    )
  },
  {
    title: "4. Go live and track conversations",
    description: "Embed the widget with a 1-line script tag, activate the WhatsApp integration, or deploy natively via REST API.",
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    visual: (
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <img src="/release-track.png" alt="Release and Track UI" className="w-full h-full object-cover object-left-top opacity-95" />
      </div>
    )
  }
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} id="how-it-works" className="bg-slate-50 relative h-[400vh]">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
            <h2 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3">How it Works</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">From zero to AI in minutes</h3>
            <p className="text-lg text-slate-600">
              We've abstracted away the complex engineering so you can focus on the experience.
            </p>
          </div>

          <div className="relative h-[450px] flex items-center justify-center">
            
            {/* Progress Line */}
            <div className="absolute left-12 md:left-1/2 top-0 bottom-0 w-1 bg-slate-200 md:-translate-x-1/2 hidden md:block rounded-full overflow-hidden">
              <motion.div 
                className="w-full bg-indigo-600 origin-top"
                style={{ scaleY: scrollYProgress }}
              />
            </div>

            {/* Cards */}
            {steps.map((step, index) => {
              // Calculate specific scroll windows for each of the 4 cards (0.25 duration each)
              const duration = 0.25;
              const start = index * duration;
              const end = start + duration;
              
              const opacity = useTransform(scrollYProgress, [start, start + 0.08, end - 0.08, end], [0, 1, 1, 0]);
              const y = useTransform(scrollYProgress, [start, start + 0.08, end - 0.08, end], [50, 0, 0, -50]);
              const scale = useTransform(scrollYProgress, [start, start + 0.08, end - 0.08, end], [0.95, 1, 1, 0.95]);

              return (
                <motion.div
                  key={index}
                  style={{ opacity, y, scale }}
                  className="absolute inset-0 flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full max-w-4xl mx-auto pointer-events-none"
                >
                  {/* Visual side */}
                  <div className={`w-full md:w-1/2 h-64 md:h-[320px] rounded-3xl ${step.bg} border-2 border-white shadow-xl flex flex-col relative overflow-hidden pointer-events-auto`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-[0.03]`}></div>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-50 ${step.color}"></div>
                    {step.visual}
                  </div>
                  
                  {/* Text side */}
                  <div className="w-full md:w-1/2 text-center md:text-left pointer-events-auto">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${step.color} text-white font-bold text-xl mb-6 shadow-md shadow-slate-200`}>
                      {index + 1}
                    </div>
                    <h4 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{step.title.split('. ')[1]}</h4>
                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}

          </div>
        </div>
      </div>
    </section>
  );
}
