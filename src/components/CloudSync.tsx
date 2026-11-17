"use client";

import { useEffect } from "react";
import { startClassroom } from "@/lib/classroom";
import { startCloud } from "@/lib/cloud";

/** Bật đồng bộ tài khoản phụ huynh (nếu đã cấu hình Supabase). Không hiển thị gì. */
export default function CloudSync() {
  useEffect(() => {
    const stopClassroom = startClassroom();
    const stopCloud = startCloud();
    return () => {
      stopCloud();
      stopClassroom();
    };
  }, []);
  return null;
}
