import { AIConfig } from "~/components/edit/AIConfig";
import { DockDemo } from "~/components/homepage/DockDemo";
import type { Route } from "./+types/edit";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Edit - React Starter Kit" },
    {
      name: "description",
      content: "AI-powered editing interface",
    },
  ];
}

export default function Edit() {
  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-950">
      {/* Main container with responsive grid */}
      <div className="h-screen flex flex-col">
        
        {/* AI Chat Window - Full width */}
        <div className="flex-1 flex flex-col p-4 lg:p-6">
          <AIConfig />
        </div>
        
      </div>
      
      <DockDemo />
    </div>
  );
}