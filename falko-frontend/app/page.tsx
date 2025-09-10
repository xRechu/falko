'use client';

import { useEffect, useState } from "react";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import CallToAction from "@/components/sections/CallToAction";
import { HeroSkeleton } from "@/components/ui/loading-skeletons";
import { useInstantLoad } from "@/lib/hooks/useLoading";

export default function Home() {
  // Dla mockProducts nie potrzebujemy loading - są dostępne od razu
  const isLoading = useInstantLoad();
  
  if (isLoading) {
    return (
      <div className="bg-background">
        <HeroSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Hero Parallax Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* Call to Action */}
      <CallToAction />
    </div>
  );
}
