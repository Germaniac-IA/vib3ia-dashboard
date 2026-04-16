"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import CashStatusBar from "./CashStatusBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <CashStatusBar />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <header
          style={{
            height: "56px",
            background: "#fff",
            borderBottom: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: "12px",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "none",
              border: "none",
              fontSize: "22px",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ☰
          </button>

          <div style={{ flex: 1 }} />

          {/* User + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handleLogout}
              title="Salir"
              style={{
                background: "none",
                border: "1px solid #eee",
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              🔓
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, background: "#f5f5f5", padding: "20px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
