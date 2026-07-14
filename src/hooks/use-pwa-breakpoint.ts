"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

export function usePwaBreakpoint() {
  return useMediaQuery("(min-width: 575px)");
}
