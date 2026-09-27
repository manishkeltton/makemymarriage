import React from "react";
import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { WeddingMemberRepository } from "@/modules/weddings/repositories/wedding-member.repository";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export default async function WeddingWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ weddingId: string }>;
}) {
  const token = await getSessionToken();
  if (!token) {
    redirect("/login");
  }

  const session = await AuthService.verifySession(token);
  if (!session.success || !session.user) {
    redirect("/login");
  }

  const { weddingId } = await params;

  let role = "ORGANISER";
  try {
    const member = await WeddingMemberRepository.findMember(weddingId, session.user.id);
    if (member) {
      role = member.role;
    }
  } catch (err) {
    console.error("Error fetching member role for layout:", err);
  }

  return (
    <WorkspaceShell weddingId={weddingId} user={session.user} role={role}>
      {children}
    </WorkspaceShell>
  );
}
