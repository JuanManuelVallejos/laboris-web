"use client";

import { useEffect } from "react";
import { ping } from "@/lib/api";

export default function WarmupPing() {
  useEffect(() => { ping(); }, []);
  return null;
}
