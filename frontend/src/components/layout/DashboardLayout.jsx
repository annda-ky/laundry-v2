"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import styles from "./DashboardLayout.module.css";

function DashboardContent({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const handleToggleCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (
      !loading &&
      user &&
      allowedRoles &&
      !allowedRoles.includes(user.role)
    ) {
      const redirectPath = user.role === "OWNER" ? "/owner" : "/kasir";
      router.push(redirectPath);
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner spinner-lg"></div>
        <p>Memuat...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.layout}>
      {/* Mobile Header with Hamburger */}
      <div className={styles.mobileHeader}>
        <button
          className={styles.hamburgerBtn}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className={styles.mobileLogo}>🧺 LaundryKu</span>
      </div>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <main
        className={`${styles.main} ${sidebarCollapsed ? styles.mainCollapsed : ""}`}
      >
        {children}
      </main>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}

export default function DashboardLayout({ children, allowedRoles }) {
  return (
    <AuthProvider>
      <DashboardContent allowedRoles={allowedRoles}>
        {children}
      </DashboardContent>
    </AuthProvider>
  );
}
