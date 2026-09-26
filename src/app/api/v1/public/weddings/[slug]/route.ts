import { NextRequest, NextResponse } from "next/server";
import { WeddingSiteService } from "@/modules/website/services/wedding-site.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const result = await WeddingSiteService.getPublicSiteBySlug(slug);

    if (!result.success) {
      const status =
        result.code === "SITE_NOT_FOUND" || result.code === "NOT_FOUND"
          ? 404
          : result.code === "SITE_UNPUBLISHED"
          ? 404
          : 400;

      const headers = new Headers();
      headers.set("Cache-Control", "no-store, max-age=0");

      return NextResponse.json(
        { success: false, error: { code: result.code || "BAD_REQUEST", message: result.error } },
        { status, headers }
      );
    }

    const headers = new Headers();
    headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    return NextResponse.json({ success: true, data: result.data }, { status: 200, headers });
  } catch (err: unknown) {
    console.error("GET Public Wedding Site Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
