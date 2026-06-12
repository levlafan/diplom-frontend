"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("eiry_token");
    
    if (token) {
      router.replace("/feed");
    } 
  }, [router]);

  return null;
}