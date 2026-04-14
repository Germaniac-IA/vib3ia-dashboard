"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (!token) return null;

  return <AppShell>{children}</AppShell>;
}
