/* RuiBoAssistant.tsx
 * LAWJOURNEY AI — RuiBo companion using cropped reference assets.
 */
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import "./RuiBoAssistant.css";

export type RuiBoState =
  | "idle"
  | "listening"
  | "thinking"
  | "analysing"
  | "responding"
  | "success"
  | "error"
  | "clarifying"
  | "low-battery";

type RuiBoAssistantProps = {
  state?: RuiBoState;
  message?: string;
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
};

const assetByState: Record<RuiBoState, string> = {
  idle: "/ruibo/idle.png",
  listening: "/ruibo/listening.png",
  thinking: "/ruibo/thinking.png",
  analysing: "/ruibo/thinking.png",
  responding: "/ruibo/listening.png",
  success: "/ruibo/success.png",
  error: "/ruibo/error.png",
  clarifying: "/ruibo/clarifying.png",
  "low-battery": "/ruibo/low-battery.png",
};

const labelByState: Record<RuiBoState, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  analysing: "Checking your document",
  responding: "Preparing your answer",
  success: "Done",
  error: "Something went wrong",
  clarifying: "Needs one detail",
  "low-battery": "Connection issue",
};

export default function RuiBoAssistant({
  state = "idle",
  message,
  showLabel = true,
  compact = false,
  className = "",
}: RuiBoAssistantProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const src = useMemo(() => assetByState[state], [state]);
  const label = message ?? labelByState[state];

  return (
    <div
      className={[
        "lj-ruibo",
        `lj-ruibo--${state}`,
        compact ? "lj-ruibo--compact" : "",
        reducedMotion ? "lj-ruibo--reduced-motion" : "",
        className,
      ].filter(Boolean).join(" ")}
      aria-live="polite"
      aria-label={`LAWJOURNEY AI assistant: ${label}`}
    >
      <div className="lj-ruibo__stage">
        <div className="lj-ruibo__halo" aria-hidden="true" />
        <div className="lj-ruibo__robot">
          <Image
            key={src}
            src={src}
            alt=""
            width={180}
            height={180}
            className="lj-ruibo__image"
            priority={state !== "idle"}
          />
        </div>
      </div>

      {showLabel && (
        <div className="lj-ruibo__status">
          <span className="lj-ruibo__dot" aria-hidden="true" />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}
