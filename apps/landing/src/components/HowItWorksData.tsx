import { Database, Bot, Play, Beaker, FileText, CheckCircle2, Settings2, SlidersHorizontal, MessageSquare, Terminal, Smartphone } from "lucide-react";

export const steps = [
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
