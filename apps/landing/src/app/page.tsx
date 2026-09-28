import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Onboarding } from "@/components/Onboarding";
import { HowItWorks } from "@/components/HowItWorks";
import { Customizable } from "@/components/Customizable";
import { Impact } from "@/components/Impact";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

import { WorkflowFeature } from "@/components/WorkflowFeature";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <WorkflowFeature />
        <Onboarding />
        <HowItWorks />
        <Customizable />
        <Impact />
        <Testimonials />
        <Pricing />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
