"use client";

import { useEffect } from "react";
import { startCloud } from "@/lib/cloud";

/** Bật đồng bộ tài khoản phụ huynh (nếu đã cấu hình Supabase). Không hiển thị gì. */
export default function CloudSync() {
  useEffect(() => startCloud(), []);
  return null;
}
