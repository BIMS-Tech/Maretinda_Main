import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import About from "@/components/About";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";
import AOSInit from "@/components/AOSInit";

export default function Home() {
  return (
    <>
      <AOSInit />
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <About />
        <Stats />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
