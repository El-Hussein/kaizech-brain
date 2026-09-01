"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { steps } from "./HowItWorksData";

export function HowItWorksDesktop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="hidden md:block bg-slate-50 relative h-[400vh]">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3">How it Works</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">From zero to AI in minutes</h3>
            <p className="text-lg text-slate-600">
              We've abstracted away the complex engineering so you can focus on the experience.
            </p>
          </div>

          <div className="relative h-[450px] flex items-center justify-center">
            
            {/* Progress Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-200 -translate-x-1/2 rounded-full overflow-hidden">
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
              
                        
              // We extract hooks to a separate component to avoid React Rules of Hooks violations inside map
              return <StepCardDesktop key={index} step={step} index={index} start={start} end={end} scrollYProgress={scrollYProgress} />;
            })}

          </div>
        </div>
      </div>
    </section>
  );
}

function StepCardDesktop({ step, index, start, end, scrollYProgress }: any) {
  // Fix: for the first step, we want it to be visible immediately, but we must ensure the math doesn't glitch.
  const opacity = useTransform(scrollYProgress, (pos: number) => {
    if (index === 0 && pos <= start) return 1;
    if (index === 3 && pos >= end) return 1;
    if (pos < start) return 0;
    if (pos > end) return 0;
    if (pos >= start && pos < start + 0.08) return (pos - start) / 0.08;
    if (pos >= start + 0.08 && pos <= end - 0.08) return 1;
    if (pos > end - 0.08 && pos <= end) return 1 - ((pos - (end - 0.08)) / 0.08);
    return 0;
  });
  
  const y = useTransform(scrollYProgress, (pos: number) => {
    if (index === 0 && pos <= start) return 0;
    if (index === 3 && pos >= end) return 0;
    if (pos < start) return 50;
    if (pos > end) return -50;
    if (pos >= start && pos < start + 0.08) return 50 - ((pos - start) / 0.08) * 50;
    if (pos >= start + 0.08 && pos <= end - 0.08) return 0;
    if (pos > end - 0.08 && pos <= end) return 0 - ((pos - (end - 0.08)) / 0.08) * 50;
    return 0;
  });
  
  const scale = useTransform(scrollYProgress, (pos: number) => {
    if (index === 0 && pos <= start) return 1;
    if (index === 3 && pos >= end) return 1;
    if (pos < start) return 0.95;
    if (pos > end) return 0.95;
    if (pos >= start && pos < start + 0.08) return 0.95 + ((pos - start) / 0.08) * 0.05;
    if (pos >= start + 0.08 && pos <= end - 0.08) return 1;
    if (pos > end - 0.08 && pos <= end) return 1 - ((pos - (end - 0.08)) / 0.08) * 0.05;
    return 1;
  });

  return (
    <motion.div
      style={{ opacity, y, scale }}
      className="absolute inset-0 flex items-center justify-center gap-16 w-full max-w-4xl mx-auto pointer-events-none"
    >
      {/* Visual side */}
      <div className={`w-1/2 h-[320px] rounded-3xl ${step.bg} border-2 border-white shadow-xl flex flex-col relative overflow-hidden pointer-events-auto shrink-0`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-[0.03]`}></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-50 ${step.color}"></div>
        {step.visual}
      </div>
      
      {/* Text side */}
      <div className="w-1/2 text-left pointer-events-auto">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${step.color} text-white font-bold text-xl mb-6 shadow-md shadow-slate-200`}>
          {index + 1}
        </div>
        <h4 className="text-3xl font-bold text-slate-900 mb-4">{step.title.split('. ')[1]}</h4>
        <p className="text-xl text-slate-600 leading-relaxed">{step.description}</p>
      </div>
    </motion.div>
  );
}
