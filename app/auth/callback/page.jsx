
"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const user = searchParams.get("user");

    if (token && user) {
      localStorage.setItem("eiry_token", token);
      localStorage.setItem("eiry_user", user);
      router.push("/");
    }
  }, [searchParams, router]);

  return <p>Вход...</p>;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<p>Вход...</p>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
