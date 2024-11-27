"use client";

import Sidebar from "@/app/components/sidebar/sidebar";
import { AppShell } from "@mantine/core";
import { useSession } from "next-auth/react";
import Loading from "@/app/loading";
import "mantine-react-table/styles.css";
import { useAuth } from "@/hooks/useAuth";

export default function MainAppShell({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, isLoading } = useAuth();
  // Private pages with sidebar (for authenticated users)
  if (isLoading) return <Loading />;
  if (isAuthenticated) {
    return (
      <AppShell>
        <AppShell.Navbar>
          <Sidebar />
        </AppShell.Navbar>
        <AppShell.Main>{children}</AppShell.Main>
        <AppShell.Footer>
          <p
            style={{
              textAlign: "center",
              margin: 8,
              fontSize: "small",
              color: "grey"
            }}
          >
            Made with ❤ by&ensp;<strong>&lt;/Dev.Team&gt;</strong>
            <br />
            of AIESEC in Sri Lanka
          </p>
        </AppShell.Footer>
      </AppShell>
    );
  }

  // Public pages (for unauthenticated users)
  return children;
}
