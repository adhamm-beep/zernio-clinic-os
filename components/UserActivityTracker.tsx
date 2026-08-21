"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const interactiveSelector = "button,a,[role='button'],[data-audit-label]";

function sendActivity(eventType: "page_view" | "click", path: string, label: string) {
  void fetch("/api/audit/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, path, label: label.slice(0, 160) }),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}

export default function UserActivityTracker() {
  const pathname = usePathname();
  const lastEvent = useRef("");

  useEffect(() => {
    if (!pathname || pathname === "/login" || pathname === "/unauthorized") return;
    const storageKey = `panthera:audit:page:${pathname}`;
    const previous = Number(window.sessionStorage.getItem(storageKey) || 0);
    const now = Date.now();
    if (now - previous < 2000) return;
    window.sessionStorage.setItem(storageKey, String(now));
    sendActivity("page_view", pathname, document.title || pathname);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(interactiveSelector) : null;
      if (!target || target.closest("[data-audit-ignore='true']")) return;
      const label = (target.dataset.auditLabel || target.getAttribute("aria-label") || target.getAttribute("title") || target.innerText || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!label) return;
      const key = `${pathname}:${label}`;
      if (lastEvent.current === key) return;
      lastEvent.current = key;
      window.setTimeout(() => { if (lastEvent.current === key) lastEvent.current = ""; }, 900);
      sendActivity("click", pathname, label);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return null;
}
