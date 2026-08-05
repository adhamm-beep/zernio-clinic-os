"use client";

import { useQuery } from "@tanstack/react-query";
import { getFollowUps } from "../api/follow-up.api";

export function useFollowUps() {
  return useQuery({
    queryKey: ["follow-ups"],
    queryFn: getFollowUps,
  });
}