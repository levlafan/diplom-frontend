"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export function useProtectedAction() {
  const router = useRouter();
  const { token } = useAuth();

  function requireAuth(action) {
    return (...args) => {
      if (!token) {
        router.push("/register");
        return;
      }
      return action(...args);
    };
  }

  return { requireAuth, isAuthenticated: Boolean(token) };
}
