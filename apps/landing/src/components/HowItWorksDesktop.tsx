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
              
              const inputOpacity = index === 0 ? [0, end - 0.08, end, 1] : index === 3 ? [0, start, start + 0.08, 1] : [0, start, start + 0.08, end - 0.08, end, 1];
              const outputOpacity = index === 0 ? [1, 1, 0, 0] : index === 3 ? [0, 0, 1, 1] : [0, 0, 1, 1, 0, 0];
              const opacity = useTransform(scrollYProgress, inputOpacity, outputOpacity);
              
              const inputY = index === 0 ? [0, end - 0.08, end, 1] : index === 3 ? [0, start, start + 0.08, 1] : [0, start, start + 0.08, end - 0.08, end, 1];
              const outputY = index === 0 ? [0, 0, -50, -50] : index === 3 ? [50, 50, 0, 0] : [50, 50, 0, 0, -50, -50];
              const y = useTransform(scrollYProgress, inputY, outputY);
              
              const inputScale = index === 0 ? [0, end - 0.08, end, 1] : index === 3 ? [0, start, start + 0.08, 1] : [0, start, start + 0.08, end - 0.08, end, 1];
              const outputScale = index === 0 ? [1, 1, 0.95, 0.95] : index === 3 ? [0.95, 0.95, 1, 1] : [0.95, 0.95, 1, 1, 0.95, 0.95];
              const scale = useTransform(scrollYProgress, inputScale, outputScale);

              return (
                <motion.div
                  key={index}
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
            })}

          </div>
        </div>
      </div>
    </section>
  );
}
