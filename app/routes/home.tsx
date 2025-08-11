import { useAuth } from "@clerk/react-router";
import { useQuery, useAction } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Route } from "./+types/home";

// Import new landing page sections
import {
  Navbar,
  HeroSection,
  HeroVideoSection,
  CompanyShowcase,
  BentoSection,
  FeatureSection,
  GrowthSection,
  TestimonialSection,
  QuoteSection,
  FAQSection,
  PricingSection,
  CTASection,
  FooterSection,
  Solution,
  HowItWorks
} from "~/components/homepage/sections";

export function meta({}: Route.MetaArgs) {
  const title = "React Starter Kit - Launch Your SAAS Quickly";
  const description =
    "This powerful starter kit is designed to help you launch your SAAS application quickly and efficiently.";
  const keywords = "React, Starter Kit, SAAS, Launch, Quickly, Efficiently";
  const siteUrl = "https://www.reactstarter.xyz/";
  const imageUrl =
    "https://jdj14ctwppwprnqu.public.blob.vercel-storage.com/rsk-image-FcUcfBMBgsjNLo99j3NhKV64GT2bQl.png";

  return [
    { title },
    {
      name: "description",
      content: description,
    },

    // Open Graph / Facebook
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:url", content: siteUrl },
    { property: "og:site_name", content: "React Starter Kit" },

    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    {
      name: "twitter:description",
      content: description,
    },
    { name: "twitter:image", content: imageUrl },
    {
      name: "keywords",
      content: keywords,
    },
    { name: "author", content: "Ras Mic" },
    { name: "favicon", content: imageUrl },
  ];
}

export default function Home() {
  const { isSignedIn, userId } = useAuth();
  const [plans, setPlans] = useState<{ items: any[] } | null>(null);
  
  // Client-side data fetching
  const subscriptionStatus = useQuery(
    api.subscriptions.checkUserSubscriptionStatus,
    userId ? { userId } : "skip"
  );
  
  // Get active products with pricing
  const getProductsWithPricing = useAction(api.products.getActiveProductsWithPricing);

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await getProductsWithPricing();
        setPlans(productsData);
      } catch (error) {
        console.error("Failed to load products:", error);
        // Set empty plans to stop loading state
        setPlans({ items: [] });
      }
    };

    loadProducts();
  }, [getProductsWithPricing]);

  const loaderData = {
    isSignedIn: !!isSignedIn,
    hasActiveSubscription: subscriptionStatus?.hasActiveSubscription || false,
    plans: plans, // Use our synced products with pricing
  };

  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <HeroSection />
        
        {/* 案例介绍 */}
        <CompanyShowcase />
        
        {/* What: 功能介绍 */}
        <Solution />
        
        {/* How: 3 Steps */}
        <HowItWorks />
        
        {/* Why: Highlights of Ringbot */}
        {/* 1\2\3...*/}
        <BentoSection />
        
        {/* Price */}
        <PricingSection />
        
        {/* Q&A */}
        <FAQSection />
        
        {/* CTA & Footer */}
        <CTASection />
        <FooterSection />
        {/*<GrowthSection />*/}
        {/*<FeatureSection />*/}
        {/*<TestimonialSection />*/}
        {/*<QuoteSection />*/}
      </main>
    </>
  );
}