import { HeroVideoDialog } from "~/components/ui/hero-video-dialog";

export function HeroVideoSection() {
  return (
    <div className="relative px-10 pb-10 mt-10">
      <div className="relative size-full shadow-xl rounded-2xl overflow-hidden">
        <HeroVideoDialog
          className="block dark:hidden"
          animationStyle="from-center"
          videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
          thumbnailSrc="https://www.mirrorfly.com/blog/wp-content/uploads/2022/03/Best-Voice-Chat-App-1024x503-1.webp"
          thumbnailAlt="Hero Video"
        />
        <HeroVideoDialog
          className="hidden dark:block"
          animationStyle="from-center"
          videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
          thumbnailSrc="https://www.mirrorfly.com/blog/wp-content/uploads/2022/03/Best-Voice-Chat-App-1024x503-1.webp"
          thumbnailAlt="Hero Video"
        />
      </div>
    </div>
  );
}