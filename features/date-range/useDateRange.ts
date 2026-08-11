"use client";

import { useContext } from "react";

import { DateRangeContext } from "./DateRangeProvider";

export function useDateRange() {
  const value = useContext(DateRangeContext);
  if (!value) throw new Error("useDateRange must be used inside DateRangeProvider");
  return value;
}

