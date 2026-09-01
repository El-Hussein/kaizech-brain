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

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
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
