"use client";

import FlickeringGrid from "@/flickering-grid";
import Ripple from "@/ripple";
import Safari from "~/components/safari";
import Section from "~/components/section";
import { cn } from "~/lib/utils";
import { motion } from "framer-motion";

const features = [
  {
    title: "Advanced AI Algorithms",
    description:
      "Our platform utilizes cutting-edge AI algorithms to provide accurate and efficient solutions for your business needs.",
    className: "hover:bg-red-500/10 dark:hover:bg-red-500/8 transition-all duration-500 ease-out",
    content: (
      <>
        <Safari
          src="/img/dashboard.png"
          url="https://acme.ai"
          className="-mb-32 mt-4 max-h-64 w-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300"
        />
      </>
    ),
  },
  {
    title: "Secure Data Handling",
    description:
      "We prioritize your data security with state-of-the-art encryption and strict privacy protocols, ensuring your information remains confidential.",
    className:
      "order-3 xl:order-none hover:bg-blue-500/10 dark:hover:bg-blue-500/8 transition-all duration-500 ease-out",
    content: (
      <Safari
        src="/img/dashboard.png"
        url="https://acme.ai"
        className="-mb-32 mt-4 max-h-64 w-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300"
      />
    ),
  },
  {
    title: "Seamless Integration",
    description:
      "Easily integrate our AI solutions into your existing workflows and systems for a smooth and efficient operation.",
    className:
      "md:row-span-2 hover:bg-orange-500/10 dark:hover:bg-orange-500/8 transition-all duration-500 ease-out",
    content: (
      <>
        <FlickeringGrid
          className="z-0 absolute inset-0 [mask:radial-gradient(circle_at_center,#fff_400px,transparent_0)]"
          squareSize={4}
          gridGap={6}
          color="#000"
          maxOpacity={0.1}
          flickerChance={0.1}
          height={800}
          width={800}
        />
        <Safari
          src="/img/dashboard.png"
          url="https://acme.ai"
          className="-mb-48 ml-12 mt-16 h-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-x-[-10px] transition-all duration-300"
        />
      </>
    ),
  },
  {
    title: "Customizable Solutions",
    description:
      "Tailor our AI services to your specific needs with flexible customization options, allowing you to get the most out of our platform.",
    className:
      "flex-row order-4 md:col-span-2 md:flex-row xl:order-none hover:bg-green-500/10 dark:hover:bg-green-500/8 transition-all duration-500 ease-out",
    content: (
      <>
        <Ripple className="absolute -bottom-full" />
        <Safari
          src="/img/dashboard.png"
          url="https://acme.ai"
          className="-mb-32 mt-4 max-h-64 w-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300"
        />
      </>
    ),
  },
];

export default function Solution() {
  return (
    <section
      id="solution"
      className="flex flex-col items-center justify-center w-full relative md:px-4"
    >
      <div className="border-x mx-5 md:mx-10 relative">
        <div className="absolute top-0 -left-4 md:-left-14 h-full w-4 md:w-14 text-primary/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>
        <div className="absolute top-0 -right-4 md:-right-14 h-full w-4 md:w-14 text-primary/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>
        
        <div className="relative container mx-auto px-4 py-16 max-w-7xl">
          <div className="text-center space-y-4 pb-6 mx-auto">
            <h2 className="text-sm text-primary font-mono font-medium tracking-wider uppercase">
              What is Ringbot?
            </h2>
            <h3 className="mx-auto mt-4 max-w-xs text-3xl font-semibold sm:max-w-none sm:text-4xl md:text-5xl">
              Core Features
            </h3>
            <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
              Generic AI tools won't suffice. Our platform is purpose-built to provide exceptional AI-driven solutions for your unique business needs.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-sm grid-cols-1 gap-6 text-gray-500 md:max-w-3xl md:grid-cols-2 xl:grid-rows-2 md:grid-rows-3 xl:max-w-6xl xl:auto-rows-fr xl:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={cn(
                  "group relative items-start overflow-hidden bg-neutral-100 dark:bg-neutral-900 p-6 rounded-2xl",
                  feature.className
                )}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100,
                  damping: 30,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
              >
                <div>
                  <h3 className="font-semibold mb-2 text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-foreground">{feature.description}</p>
                </div>
                {feature.content}
                <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-neutral-200 dark:from-neutral-950 pointer-events-none"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}