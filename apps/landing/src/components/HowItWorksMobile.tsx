"use client";

import { motion } from "framer-motion";
import { steps } from "./HowItWorksData";

export function HowItWorksMobile() {
  return (
    <section id="how-it-works-mobile" className="block md:hidden bg-slate-50 py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3">How it Works</h2>
          <h3 className="text-4xl font-bold text-slate-900 mb-4">From zero to AI in minutes</h3>
          <p className="text-lg text-slate-600">
            We've abstracted away the complex engineering so you can focus on the experience.
          </p>
        </div>

        <div className="space-y-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-6"
            >
              {/* Visual side */}
              <div className={`w-full h-56 rounded-3xl ${step.bg} border-2 border-white shadow-lg flex flex-col relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-[0.05]`}></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-50 ${step.color}"></div>
                {step.visual}
              </div>
              
              {/* Text side */}
              <div className="w-full text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${step.color} text-white font-bold text-xl mb-4 shadow-sm shadow-slate-200`}>
                  {index + 1}
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-3">{step.title.split('. ')[1]}</h4>
                <p className="text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
