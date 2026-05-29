import HeroSection         from "@/components/home/HeroSection";
import ServicesSection     from "@/components/home/ServiceSection";
import VirtualTryOnSection from "@/components/home/VirtualSection";
import TestimonialSection  from "@/components/home/TestimonialSection";
import CTASection          from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <VirtualTryOnSection />
      <TestimonialSection />
      <CTASection />
    </>
  );
}