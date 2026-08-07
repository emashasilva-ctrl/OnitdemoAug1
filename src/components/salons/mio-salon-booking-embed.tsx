"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const BARE_URL_PATTERN = /^https?:\/\/\S+$/i;

// Vendor-pasted snippets often ship with a short fixed height (MioSalon's
// own default is 400px) sized for a single step, not a full multi-step
// booking flow — which then scrolls awkwardly inside its own tiny iframe.
// We override to something roomier regardless of what height was pasted.
const MIN_IFRAME_HEIGHT = 800;

const IFRAME_TAG_PATTERN = /<iframe\b[^>]*>/gi;
const HEIGHT_ATTR_PATTERN = /\sheight\s*=\s*["']?(\d+)["']?/i;
const STYLE_ATTR_PATTERN = /(\sstyle\s*=\s*["'])([^"']*)(["'])/i;
const SCRIPT_TAG_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const ATTR_PATTERN =
  /([a-zA-Z0-9_-]+)\s*=\s*"([^"]*)"|([a-zA-Z0-9_-]+)\s*=\s*'([^']*)'|([a-zA-Z0-9_-]+)/g;

interface ExtractedScript {
  attrs: [string, string][];
  text: string;
}

function bumpIframeHeights(html: string): string {
  return html.replace(IFRAME_TAG_PATTERN, (tag) => {
    const heightMatch = tag.match(HEIGHT_ATTR_PATTERN);
    const currentHeight = heightMatch ? parseInt(heightMatch[1], 10) : 0;
    let next = tag;
    if (!heightMatch) {
      next = next.replace(/^<iframe\b/i, `<iframe height="${MIN_IFRAME_HEIGHT}"`);
    } else if (currentHeight < MIN_IFRAME_HEIGHT) {
      next = next.replace(HEIGHT_ATTR_PATTERN, ` height="${MIN_IFRAME_HEIGHT}"`);
    }
    next = next.replace(STYLE_ATTR_PATTERN, (_m, pre, styleBody, post) => {
      const stripped = String(styleBody).replace(/height\s*:\s*[^;]+;?/gi, "").trim();
      return `${pre}${stripped}${post}`;
    });
    return next;
  });
}

function parseAttrs(attrString: string): [string, string][] {
  const attrs: [string, string][] = [];
  ATTR_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR_PATTERN.exec(attrString))) {
    const name = match[1] ?? match[3] ?? match[5];
    const value = match[2] ?? match[4] ?? "";
    if (name) attrs.push([name, value]);
  }
  return attrs;
}

function extractScripts(html: string): { markup: string; scripts: ExtractedScript[] } {
  const scripts: ExtractedScript[] = [];
  const markup = html.replace(SCRIPT_TAG_PATTERN, (_full, attrString: string, text: string) => {
    scripts.push({ attrs: parseAttrs(attrString), text });
    return "";
  });
  return { markup, scripts };
}

/**
 * Renders a vendor-pasted MioSalon booking widget behind a "Book Now"
 * button that opens it in a dialog, rather than embedding it inline in the
 * page flow. Two reasons: an 800px iframe sitting mid-page is heavy by
 * default, and Radix's Dialog doesn't mount its content until first opened,
 * so the widget (and its cross-origin request) doesn't load for every
 * visitor — only those who actually click through to book.
 *
 * Vendors more often have just their plain MioSalon booking-page link on
 * hand, not raw embed HTML — a bare link can't be embedded reliably
 * (booking pages commonly block framing), so that case renders a direct
 * external "Book on MioSalon" link instead.
 *
 * Parsing (bumping any short iframe height, and extracting <script> tags
 * since dangerouslySetInnerHTML won't execute them) is done with plain
 * string/regex processing rather than DOMParser, which is a browser-only API
 * that would crash during server rendering — this way the markup can be
 * derived directly during render. Extracted scripts are injected as real DOM
 * nodes once the dialog is actually opened.
 */
export function MioSalonBookingEmbed({
  embedCode,
  salonName,
}: {
  embedCode: string;
  salonName: string;
}) {
  const trimmed = embedCode.trim();
  const isBareUrl = BARE_URL_PATTERN.test(trimmed);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { markup, scripts } = useMemo(() => {
    if (isBareUrl) return { markup: "", scripts: [] as ExtractedScript[] };
    return extractScripts(bumpIframeHeights(embedCode));
  }, [embedCode, isBareUrl]);

  useEffect(() => {
    if (isBareUrl || !open) return;
    const container = containerRef.current;
    if (!container) return;

    const injected: HTMLScriptElement[] = [];
    for (const { attrs, text } of scripts) {
      const el = document.createElement("script");
      for (const [name, value] of attrs) el.setAttribute(name, value);
      el.text = text;
      container.appendChild(el);
      injected.push(el);
    }

    return () => {
      for (const el of injected) el.remove();
    };
  }, [isBareUrl, open, scripts]);

  if (isBareUrl) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          This salon takes bookings through MioSalon.
        </p>
        <a
          href={trimmed}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Book on MioSalon
          <ExternalLink className="size-4" />
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          This salon takes bookings through MioSalon.
        </p>
        <Button onClick={() => setOpen(true)} className="rounded-full px-6">
          <Calendar className="size-4" />
          Book Now
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book with {salonName}</DialogTitle>
            <DialogDescription>Powered by MioSalon</DialogDescription>
          </DialogHeader>
          <div dangerouslySetInnerHTML={{ __html: markup }} />
          <div ref={containerRef} />
        </DialogContent>
      </Dialog>
    </>
  );
}
