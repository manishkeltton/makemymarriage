"use client";

import React, { useState } from "react";
import { WeddingProvider } from "./wedding-context";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { WorkspaceHeader } from "./workspace-header";

export interface WorkspaceShellProps {
  weddingId?: string;
  user?: {
    name: string;
    email: string;
  };
  role?: string;
  children: React.ReactNode;
}

export function WorkspaceShell({
  weddingId,
  user,
  role = "Admin",
  children,
}: WorkspaceShellProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <WeddingProvider initialWeddingId={weddingId}>
      <div className="min-h-screen bg-background font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary">
        {/* Persistent Desktop / Drawer Mobile Sidebar */}
        <WorkspaceSidebar
          weddingId={weddingId}
          user={user}
          role={role}
          isOpenMobile={isOpenMobile}
          onCloseMobile={() => setIsOpenMobile(false)}
        />

        {/* Workspace Shell Top Header */}
        <WorkspaceHeader
          user={user}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
        />

        {/* Workspace Canvas Main Content Area */}
        <div className="pl-0 lg:pl-64 pt-16 min-h-screen flex flex-col">
          <main className="w-full flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </WeddingProvider>
  );
}
