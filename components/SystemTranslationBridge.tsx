"use client";

import { useEffect } from "react";
import {
  normalizeInterfaceDigits,
  translateSystemText,
  translateSystemTextToEnglish,
} from "@/lib/system-translations";
import { useLocale } from "@/components/LocaleProvider";

const attributes = ["placeholder", "title", "aria-label"] as const;

function localize(value: string, arabic: boolean) {
  const normalized = normalizeInterfaceDigits(value);
  return arabic ? translateSystemText(normalized) : translateSystemTextToEnglish(normalized);
}

function localizeTextNode(node: Text, arabic: boolean) {
  if (node.parentElement?.closest("script,style,code,pre,[data-no-translate]")) return;
  const current = node.nodeValue ?? "";
  const translated = localize(current, arabic);
  if (translated !== current) node.nodeValue = translated;
}

function localizeElement(element: Element, arabic: boolean) {
  if (element.matches("script,style,code,pre,[data-no-translate]")) return;
  for (const attribute of attributes) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const translated = localize(current, arabic);
    if (translated !== current) element.setAttribute(attribute, translated);
  }
}

function localizeTree(root: Node, arabic: boolean) {
  if (root instanceof Text) localizeTextNode(root, arabic);
  if (root instanceof Element) localizeElement(root, arabic);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node instanceof Text) localizeTextNode(node, arabic);
    else if (node instanceof Element) localizeElement(node, arabic);
    node = walker.nextNode();
  }
}

export default function SystemTranslationBridge() {
  const { isArabic } = useLocale();
  useEffect(() => {
    let applying = false;
    const apply = (root: Node = document.body) => {
      if (applying) return;
      applying = true;
      localizeTree(root, isArabic);
      applying = false;
    };
    apply();
    const observer = new MutationObserver((records) => {
      if (applying) return;
      for (const record of records) {
        if (record.type === "characterData") apply(record.target);
        if (record.type === "attributes") apply(record.target);
        for (const node of record.addedNodes) apply(node);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...attributes],
    });
    return () => observer.disconnect();
  }, [isArabic]);
  return null;
}
