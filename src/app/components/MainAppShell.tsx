"use client";

import Sidebar from "@/app/components/sidebar/sidebar";
import { AppShell } from "@mantine/core";
import { useSession } from "next-auth/react";
import Loading from "@/app/loading";

export default function MainAppShell({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { data, status } = useSession();

  if (status === "loading") return <Loading />;

  // Private pages with sidebar (for authenticated users)
  if (status === "unauthenticated")
    return (
      <AppShell>
        <AppShell.Navbar>
          <Sidebar />
        </AppShell.Navbar>
        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    );

  // Public pages (for unauthenticated users)
  return children;
}
