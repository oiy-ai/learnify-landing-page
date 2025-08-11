import { HeroVideoSection } from "~/components/homepage/sections/hero-video-section";
import { siteConfig } from "~/lib/config";
import { Link } from "react-router";
import Spline from "@splinetool/react-spline";
import { FlickeringGrid } from "~/components/ui/flickering-grid";
import { useEffect, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function HeroSection() {
  const { hero } = siteConfig;
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retellClientRef = useRef<any | null>(null);

  const createWebCall = useAction(api.retell.createWebCall);

  return (
    <section id="hero" className="w-full relative">
      <div className="relative flex flex-col items-center w-full">
        <div className="absolute inset-0">
          <div className="absolute inset-0 -z-10 h-[600px] md:h-[800px] w-full [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--secondary)_100%)] rounded-b-xl"></div>
        </div>
        <div className="relative z-10 pt-28 max-w-3xl mx-auto h-full w-full flex flex-col gap-10 items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-5">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance text-center text-primary">
              {hero.title}
            </h1>
            <p className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight">
              {hero.description}
            </p>
          </div>
          <div className="relative flex items-center gap-2.5 flex-wrap justify-center h-72 w-[70vw]">
            <FlickeringGrid
              className="absolute inset-0 z-0"
              style={{
                  maskImage: 'linear-gradient(to right, transparent 0%, white 30%, white 70%, transparent 100%), linear-gradient(to bottom, transparent 0%, white 40%, white 60%, transparent 100%)',
                  
                maskComposite: 'intersect',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, white 40%, white 60%, transparent 100%), linear-gradient(to bottom, transparent 0%, white 40%, white 60%, transparent 100%)',
                WebkitMaskComposite: 'source-in'
              }}
              squareSize={10}
              gridGap={7}
              color="var(--theme-color)"
              maxOpacity={0.6}
              flickerChance={0.4}
            />
            <div className="relative z-999 w-52 h-52 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-180 h-64">
                <Spline 
                  scene="https://prod.spline.design/QEyk3YT7weAvz2vW/scene.splinecode" 
                  onMouseUp={async (e) => {
                    setError(null);
                    try {
                      if (!isRecording) {
                        setIsStarting(true);
                        const { access_token } = await createWebCall();
                        const { RetellWebClient } = await import("retell-client-js-sdk");
                        if (!retellClientRef.current) {
                          retellClientRef.current = new RetellWebClient();
                          // 事件监听（可用于 UI 动效与调试）
                          retellClientRef.current.on("call_started", () => {
                            console.log("call started");
                          });
                          retellClientRef.current.on("call_ended", () => {
                            console.log("call ended");
                            setIsRecording(false);
                          });
                          retellClientRef.current.on("agent_start_talking", () => {
                            console.log("agent_start_talking");
                          });
                          retellClientRef.current.on("agent_stop_talking", () => {
                            console.log("agent_stop_talking");
                          });
                          retellClientRef.current.on("update", (update: any) => {
                            // console.log(update);
                          });
                          retellClientRef.current.on("error", (err: any) => {
                            console.error("Retell error:", err);
                            setError(err?.message || "通话出错");
                            try { retellClientRef.current?.stopCall?.(); } catch {}
                            setIsRecording(false);
                          });
                        }

                        await retellClientRef.current.startCall({
                          accessToken: access_token,
                          // 可选项：sampleRate、captureDeviceId、playbackDeviceId、emitRawAudioSamples
                          sampleRate: 24000,
                        });
                        setIsRecording(true);
                      } else {
                        try {
                          await retellClientRef.current?.stopCall?.();
                        } catch (e) {
                          console.warn("stopCall failed", e);
                        }
                        setIsRecording(false);
                      }
                    } catch (err: any) {
                      console.error(err);
                      setError(err?.message || "启动语音通话失败");
                      setIsRecording(false);
                    } finally {
                      setIsStarting(false);
                    }
                    console.log(isRecording ? '语音结束' : '语音开始', e);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <HeroVideoSection />
      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-red-500 text-sm bg-background/60 px-3 py-1 rounded-md border">
          {error}
        </div>
      )}
    </section>
  );
}