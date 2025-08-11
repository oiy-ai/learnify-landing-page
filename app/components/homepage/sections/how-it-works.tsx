import Features from "~/components/features-vertical";
import Section from "~/components/section";
import { Sparkles, Upload, Zap } from "lucide-react";

const data = [
  {
    id: 1,
    title: "1. Configure via chat",
    content:
      "Configure your dedicated AI customer service through natural and simple language.",
    image: "/img/dashboard.png",
    icon: <Upload className="w-6 h-6 text-secondary" />,
  },
  {
    id: 2,
    title: "2. Publish",
    content:
      "Our advanced AI algorithms automatically process and analyze your data, extracting valuable insights and patterns that would be difficult to identify manually.",
    image: "/img/dashboard.png",
    icon: <Zap className="w-6 h-6 text-secondary" />,
  },
  {
    id: 3,
    title: "3. Replace phone number",
    content:
      "Receive clear, actionable insights and recommendations based on the AI analysis. Use these insights to make data-driven decisions and improve your business strategies.",
    image: "/img/dashboard.png",
    icon: <Sparkles className="w-6 h-6 text-secondary" />,
  },
];

export default function HowItWorks() {
  return (
    <div className="w-full flex justify-center">
      <Section title="How it works?" subtitle="3 steps to get everything done">
        <Features data={data} />
      </Section>
    </div>
  );
}