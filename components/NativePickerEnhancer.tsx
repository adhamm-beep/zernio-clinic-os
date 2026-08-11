"use client";

import { useEffect } from "react";

const nativePickerSelector = [
  'input[type="date"]',
  'input[type="datetime-local"]',
  'input[type="time"]',
  'input[type="month"]',
  'input[type="week"]',
].join(",");

function findPickerInput(target: Element) {
  if (target.matches(nativePickerSelector)) {
    return target as HTMLInputElement;
  }

  const field = target.closest("label, [data-native-picker-field]");
  return field?.querySelector<HTMLInputElement>(nativePickerSelector) ?? null;
}

export default function NativePickerEnhancer() {
  useEffect(() => {
    const openPicker = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const input = findPickerInput(event.target);
      if (!input || input.disabled || input.readOnly) return;

      input.focus({ preventScroll: true });
      try {
        input.showPicker?.();
      } catch {
        // Focusing keeps the native control usable in browsers without showPicker.
      }
    };

    document.addEventListener("click", openPicker);
    return () => document.removeEventListener("click", openPicker);
  }, []);

  return null;
}
