import { FirstBentoAnimation } from "~/components/homepage/first-bento-animation";
import { FourthBentoAnimation } from "~/components/homepage/fourth-bento-animation";
import { SecondBentoAnimation } from "~/components/homepage/second-bento-animation";
import { ThirdBentoAnimation } from "~/components/homepage/third-bento-animation";
import { FlickeringGrid } from "~/components/ui/flickering-grid";
import { Globe } from "~/components/ui/globe";
import { cn } from "~/lib/utils";
import { motion } from "motion/react";

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        "p-1 py-0.5 font-medium dark:font-semibold text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
};

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "Ringbot",
  description: "Smart scheduling powered by AI.",
  cta: "Get Started",
  url: typeof window !== 'undefined' 
    ? (import.meta.env?.VITE_FRONTEND_URL || "http://localhost:5173")
    : "http://localhost:5173",
  keywords: [
    "AI Calendar",
    "Smart Scheduling",
    "Productivity",
    "Time Management",
  ],
  links: {
    email: "support@calai.app",
    twitter: "https://twitter.com/calaiapp",
    discord: "https://discord.gg/calaiapp",
    github: "https://github.com/calaiapp",
    instagram: "https://instagram.com/calaiapp",
  },
  nav: {
    links: [
      { id: 1, name: "Home", href: "#hero" },
      { id: 2, name: "How it Works", href: "#bento" },
      { id: 3, name: "Features", href: "#features" },
      { id: 4, name: "Pricing", href: "#pricing" },
    ],
  },
  hero: {
    title: "AI Assistant for Effortless Reservations",
    description: "Book appointments instantly using voice or text — no calls, no forms, no hassle.",
  },
  bentoSection: {
    title: "Our Core Strengths",
    description: "why Ringbot?",
    items: [
      {
        id: 1,
        title: "AI Automation",
        description: "Automate complex workflows with AI",
        content: <FirstBentoAnimation />,
      },
      {
        id: 2,
        title: "Smart Integrations",
        description: "Connect with your favorite tools",
        content: <SecondBentoAnimation />,
      },
      {
        id: 3,
        title: "Real-time Analytics",
        description: "Track performance in real-time",
        content: <ThirdBentoAnimation 
          data={[10, 20, 35, 50, 75, 100]}
          toolTipValues={[10, 20, 35, 50, 75, 100]}
        />,
      },
      {
        id: 4,
        title: "Global Reach",
        description: "Deploy worldwide instantly",
        content: <FourthBentoAnimation />,
      },
    ],
  },
  companyShowcase: {
    companyLogos: [
      {
        id: 1,
        logo: <div className="text-lg font-bold">Company 1</div>,
      },
      {
        id: 2,
        logo: <div className="text-lg font-bold">Company 2</div>,
      },
      {
        id: 3,
        logo: <div className="text-lg font-bold">Company 3</div>,
      },
      {
        id: 4,
        logo: <div className="text-lg font-bold">Company 4</div>,
      },
    ],
  },
  ctaSection: {
    title: "Ready to Start?",
    backgroundImage: "/img/agent-cta-background.png",
    button: {
      text: "Get Started Now",
      href: "/sign-up",
    },
    subtext: "No credit card required",
  },
  faqSection: {
    title: "Frequently Asked Questions",
    description: "Find answers to common questions about RingBot",
    faQitems: [
      {
        question: "What is RingBot?",
        answer: "RingBot is an AI-powered platform that helps you build intelligent agents for your business.",
      },
      {
        question: "How does pricing work?",
        answer: "We offer flexible pricing plans to suit businesses of all sizes. Check out our pricing section for details.",
      },
      {
        question: "Is there a free trial?",
        answer: "Yes, we offer a 14-day free trial with full access to all features.",
      },
    ],
  },
  featureSection: {
    title: "Why Choose RingBot?",
    description: "Discover the features that make RingBot the best choice for your AI needs",
    items: [
      {
        id: 1,
        title: "Easy Setup",
        description: "Get started in minutes",
        content: "Get started in minutes",
        image: "/img/feature-1.png",
      },
      {
        id: 2,
        title: "Powerful AI",
        description: "State-of-the-art AI technology",
        content: "State-of-the-art AI technology",
        image: "/img/feature-2.png",
      },
    ],
  },
  growthSection: {
    title: "Scale Your Business",
    description: "Grow with confidence using our powerful platform",
    charts: {
      data: [10, 20, 35, 50, 75, 100],
      toolTipValues: ["10%", "20%", "35%", "50%", "75%", "100%"],
    },
    items: [
      {
        id: 1,
        title: "Analytics Dashboard",
        description: "Track your performance with detailed analytics",
        content: <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />,
      },
      {
        id: 2,
        title: "Team Collaboration",
        description: "Work together seamlessly with your team",
        content: <div className="h-48 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg" />,
      },
    ],
  },
  pricing: {
    title: "Pricing",
    description: "One month free trial / Pay as you go / Monthly subscription",
    pricingItems: [
      {
        name: "Basic",
        price: "$19",
        yearlyPrice: "$190",
        description: "Perfect for getting started",
        features: ["Up to 1,000 requests", "Basic support", "API access"],
        buttonText: "Get Started",
        buttonColor: "bg-primary text-primary-foreground",
        isPopular: false,
      },
      {
        name: "Pro",
        price: "$49",
        yearlyPrice: "$490",
        description: "Best for growing businesses",
        features: ["Up to 10,000 requests", "Priority support", "Advanced analytics"],
        buttonText: "Choose Pro",
        buttonColor: "bg-primary text-primary-foreground",
        isPopular: true,
      },
      {
        name: "Enterprise",
        price: "$199",
        yearlyPrice: "$1990",
        description: "For large organizations",
        features: ["Unlimited requests", "24/7 support", "Custom integrations"],
        buttonText: "Contact Sales",
        buttonColor: "bg-primary text-primary-foreground",
        isPopular: false,
      },
    ],
  },
  quoteSection: {
    quote: "RingBot has transformed how we handle customer support. The AI agent understands context perfectly.",
    author: {
      name: "John Doe",
      role: "CEO, Tech Corp",
      image: "/img/testimonial-1.jpg",
    },
  },
  testimonials: [
    {
      id: "1",
      name: "Alice Johnson",
      role: "Product Manager",
      company: "TechStart Inc.",
      img: "/img/testimonial-1.jpg",
      description: "RingBot made our workflow incredibly efficient. Highly recommend!",
    },
    {
      id: "2",
      name: "Bob Smith",
      role: "CTO",
      company: "InnovateCorp",
      img: "/img/testimonial-2.jpg",
      description: "The best AI platform we've used. Excellent customer support.",
    },
  ],
  footerLinks: [
    {
      title: "Product",
      links: [
        { id: 1, title: "Features", url: "#features" },
        { id: 2, title: "Pricing", url: "#pricing" },
        { id: 3, title: "API", url: "/api" },
      ],
    },
    {
      title: "Company",
      links: [
        { id: 1, title: "About", url: "/about" },
        { id: 2, title: "Blog", url: "/blog" },
        { id: 3, title: "Careers", url: "/careers" },
      ],
    },
    {
      title: "Support",
      links: [
        { id: 1, title: "Help Center", url: "/help" },
        { id: 2, title: "Contact", url: "/contact" },
        { id: 3, title: "Status", url: "/status" },
      ],
    },
  ],
};