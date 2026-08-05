"use client";

import { createContext } from "react";

import type { ClinicContextValue } from "../types/clinic";

export const ClinicContext =
  createContext<ClinicContextValue | null>(null);