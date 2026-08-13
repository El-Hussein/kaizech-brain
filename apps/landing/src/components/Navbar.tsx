"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Brain, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="Kaizech Brain" width={32} height={32} className="rounded-lg shadow-sm" />
            <span className="font-bold text-xl tracking-tight text-slate-900">Kaizech Brain</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#services" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Services</Link>
            <Link href="/#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How it Works</Link>
            <Link href="/#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</Link>
            <Link href="/integration" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Integration</Link>
          </nav>
          
          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="http://localhost:5173/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Log in
            </Link>
            <Link href="/#pricing" className="text-sm font-medium bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-lg p-4 flex flex-col gap-4"
        >
          <Link href="/#services" className="text-sm font-medium text-slate-600 p-2 hover:bg-slate-50 rounded-md">Services</Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-slate-600 p-2 hover:bg-slate-50 rounded-md">How it Works</Link>
          <Link href="/#pricing" className="text-sm font-medium text-slate-600 p-2 hover:bg-slate-50 rounded-md">Pricing</Link>
          <Link href="/integration" className="text-sm font-medium text-slate-600 p-2 hover:bg-slate-50 rounded-md">Integration</Link>
          <hr className="border-slate-100" />
          <Link href="http://localhost:5173/login" className="text-sm font-medium text-slate-600 p-2 hover:bg-slate-50 rounded-md">Log in</Link>
          <Link href="/#pricing" className="text-sm font-medium text-center bg-indigo-600 text-white p-3 rounded-lg mt-2">Get Started</Link>
        </motion.div>
      )}
    </header>
  );
}
