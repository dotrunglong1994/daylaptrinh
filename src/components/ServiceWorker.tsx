"use client";

import { useEffect } from "react";
import { setupPwa } from "@/lib/pwa";

export default function ServiceWorker() {
  useEffect(setupPwa, []);
  return null;
}
