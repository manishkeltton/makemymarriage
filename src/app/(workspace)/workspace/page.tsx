import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { WeddingService } from "@/modules/weddings/services/wedding.service";

export default async function WorkspaceIndexPage() {
  const token = await getSessionToken();
  if (!token) {
    redirect("/login");
  }

  const session = await AuthService.verifySession(token);
  if (!session.success || !session.user) {
    redirect("/login");
  }

  const userWeddingsResult = await WeddingService.getUserWeddings(session.user.id);
  if (
    !userWeddingsResult.success ||
    !userWeddingsResult.weddings ||
    userWeddingsResult.weddings.length === 0
  ) {
    redirect("/workspace/new");
  }

  const cookieStore = await cookies();
  const lastAccessedId = cookieStore.get("last_accessed_wedding_id")?.value;

  if (lastAccessedId) {
    const matched = userWeddingsResult.weddings.find(
      (w) => w.wedding.id === lastAccessedId
    );
    if (matched) {
      redirect(`/workspace/${lastAccessedId}`);
    }
  }

  // Default to most recently created or first active wedding
  const targetWeddingId = userWeddingsResult.weddings[0].wedding.id;
  redirect(`/workspace/${targetWeddingId}`);
}
