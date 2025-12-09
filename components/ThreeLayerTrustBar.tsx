"use client";

import Image, { type StaticImageData } from "next/image";
import { useMemo, type CSSProperties } from "react";
import chatgptLogo from "@/assets/chatgpt-white-transparent.png";
import claudeLogo from "@/assets/claude-white-transparent.png";
import deepseekLogo from "@/assets/deepseek-white-transparent.png";
import geminiLogo from "@/assets/gemini-white-transparent.png";
import grokLogo from "@/assets/grok-white-transparent.png";
import metaLogo from "@/assets/meta-white-transparent (1).png";
import perplexityLogo from "@/assets/perplexity-white-transparent.png";

type Direction = "ltr" | "rtl";

interface MarqueeRowProps {
  items: string[];
  duration: number; // seconds
  direction?: Direction;
}

interface MarqueeLogosRowProps {
  items: { alt: string; src: StaticImageData }[];
  duration: number; // seconds
  direction?: Direction;
}

const cardBase =
  "rounded-lg border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 shadow-sm px-6 py-3 text-sm md:text-base font-medium whitespace-nowrap";

const logoCardBaseDesktop =
  "inline-flex h-[64px] w-[176px] items-center justify-center rounded-sm border border-gray-800 bg-black shadow-sm overflow-hidden";

function MarqueeRow({ items, duration, direction = "ltr" }: MarqueeRowProps) {
  const keyframesName = useMemo(
    () => `marquee-${direction}-${duration}`.replace(/\./g, "-"),
    [direction, duration]
  );

  const animationStyle: CSSProperties = {
    animation: `${keyframesName} ${duration}s linear infinite`,
  };

  const translateStart = direction === "ltr" ? "translateX(-50%)" : "translateX(0%)";
  const translateEnd = direction === "ltr" ? "translateX(0%)" : "translateX(-50%)";

  return (
    <div className="relative w-full overflow-hidden">
      <style>{`
        @keyframes ${keyframesName} {
          0% { transform: ${translateStart}; }
          100% { transform: ${translateEnd}; }
        }
      `}</style>
      <div
        className="flex w-[200%] items-center gap-4"
        style={animationStyle}
        aria-hidden="true"
      >
        {[...items, ...items].map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            className={`${cardBase} transition-transform duration-200 hover:scale-[1.03]`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function MarqueeLogosRow({ items, duration, direction = "ltr" }: MarqueeLogosRowProps) {
  const keyframesName = useMemo(
    () => `marquee-logos-${direction}-${duration}`.replace(/\./g, "-"),
    [direction, duration]
  );

  const animationStyle: CSSProperties = {
    animation: `${keyframesName} ${duration}s linear infinite`,
  };

  const translateStart = direction === "ltr" ? "translateX(-50%)" : "translateX(0%)";
  const translateEnd = direction === "ltr" ? "translateX(0%)" : "translateX(-50%)";

  return (
    <div className="relative w-full overflow-hidden py-3">
      <style>{`
        @keyframes ${keyframesName} {
          0% { transform: ${translateStart}; }
          100% { transform: ${translateEnd}; }
        }
      `}</style>
      <div className="relative flex w-[200%] items-center gap-6" style={animationStyle} aria-hidden="true">
        {[...items, ...items].map((item, idx) => (
          <div key={`${item.alt}-${idx}`} className="transition-transform duration-200 hover:scale-[1.03]">
            {/* Mobile: logo only, no box */}
            <div className="flex h-10 items-center justify-center md:hidden">
              <Image
                src={item.src}
                alt={item.alt}
                width={160}
                height={40}
                className="h-8 w-auto object-contain"
                sizes="160px"
                priority
              />
            </div>

            {/* Desktop: boxed logo */}
            <div className={`${logoCardBaseDesktop} hidden md:inline-flex`}>
              <Image
                src={item.src}
                alt={item.alt}
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
                sizes="176px"
                priority
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThreeLayerTrustBar() {
  const layerTop = [
    "Summarize my voice note",
    "Write this better",
    "Explain this image",
    "Create 10 marketing ideas",
    "Rewrite this message",
    "Analyze this screenshot",
    "Turn my thought into a script",
    "Help me plan my project",
    "Clean up this paragraph",
    "Turn this audio into text",
  ];

  const layerMid = [
    "Backed by Founder Institute",
    "Cybersecurity for Voice™",
    "Identity Protected",
    "End-to-End Encryption",
    "Multimodel Access",
    "Safe By Default",
    "Fast +Cloud",
    "Multimodal Secure AI",
    "Private Data Protection",
  ];

  const layerBot = [
    { alt: "GPT", src: chatgptLogo },
    { alt: "Claude", src: claudeLogo },
    { alt: "Gemini", src: geminiLogo },
    { alt: "Grok", src: grokLogo },
    { alt: "DeepSeek", src: deepseekLogo },
    { alt: "Perplexity", src: perplexityLogo },
    { alt: "Meta", src: metaLogo },
  ];

  return (
    <div className="w-full py-9 md:py-10 space-y-3 md:space-y-4">
      <MarqueeRow items={layerTop} duration={20} direction="ltr" />
      <MarqueeLogosRow items={layerBot} duration={13} direction="ltr" />
      <MarqueeRow items={layerMid} duration={40} direction="rtl" />
    </div>
  );
}

