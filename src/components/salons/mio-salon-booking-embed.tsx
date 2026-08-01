"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a vendor-pasted MioSalon booking-widget embed snippet. Split into
 * two parts because dangerouslySetInnerHTML does not execute <script> tags:
 * script tags are extracted and injected as real DOM nodes in an effect, and
 * everything else (e.g. a container div or iframe) is rendered as raw HTML.
 */
export function MioSalonBookingEmbed({ embedCode }: { embedCode: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const doc = new DOMParser().parseFromString(embedCode, "text/html");
    const scripts = Array.from(doc.querySelectorAll("script"));
    const injected: HTMLScriptElement[] = [];

    for (const script of scripts) {
      const el = document.createElement("script");
      for (const attr of Array.from(script.attributes)) {
        el.setAttribute(attr.name, attr.value);
      }
      el.text = script.textContent ?? "";
      container.appendChild(el);
      injected.push(el);
    }

    return () => {
      for (const el of injected) el.remove();
    };
  }, [embedCode]);

  const markupOnly = embedCode.replace(/<script[\s\S]*?<\/script>/gi, "");

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div ref={markupRef} dangerouslySetInnerHTML={{ __html: markupOnly }} />
      <div ref={containerRef} />
    </div>
  );
}
