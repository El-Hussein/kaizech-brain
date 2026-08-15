"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

export function Contact() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    website: "",
    companySize: "1-50 employees",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/v1/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 overflow-hidden relative shadow-2xl">
          {/* Background decor */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 translate-x-1/3 -translate-y-1/2"></div>
          
          <div className="grid lg:grid-cols-2 gap-12 p-8 md:p-16 relative z-10">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-sm font-medium mb-6">
                Early Bird Access
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Ready to transform your business?
              </h2>
              <p className="text-slate-300 text-lg mb-8 max-w-md">
                Join our Early Bird program today and get exclusive onboarding support, custom agent configuration, and 3 months of Enterprise features for free.
              </p>
              
              <ul className="space-y-4 mb-8 text-slate-300">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-300 text-sm">1</div>
                  Dedicated Solutions Architect
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-300 text-sm">2</div>
                  Custom RAG Data Pipeline Setup
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-300 text-sm">3</div>
                  Priority Feature Requests
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl">
              {isSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Received!</h3>
                  <p className="text-slate-600">Our team will be in touch within 24 hours to set up your Early Bird access.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Contact Sales</h3>
                  
                  {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm">{error}</div>}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                      <input name="firstName" value={formData.firstName} onChange={handleChange} type="text" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                      <input name="lastName" value={formData.lastName} onChange={handleChange} type="text" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Work Email</label>
                    <input name="email" value={formData.email} onChange={handleChange} type="email" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website (Optional)</label>
                    <input name="website" value={formData.website} onChange={handleChange} type="url" placeholder="https://example.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Size</label>
                    <select name="companySize" value={formData.companySize} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                      <option value="1-50 employees">1-50 employees</option>
                      <option value="51-200 employees">51-200 employees</option>
                      <option value="201-1000 employees">201-1000 employees</option>
                      <option value="1000+ employees">1000+ employees</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">How can we help?</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} rows={3} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"></textarea>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? "Sending..." : "Request Early Bird Access"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
