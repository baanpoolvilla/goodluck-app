import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/register"];
const ADMIN_ONLY_PREFIXES = [
  "/settings/grading",
  "/settings/users",
  "/api/hub",
  "/api/users",
  "/api/grades/calculate",
];

export async function proxy(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublic && !pathname.startsWith("/api/webhooks")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Admin-only route prefixes get a role check here; the actual
  // enforcement of record-level access still lives in RLS + route handlers.
  if (user && ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-.*\\.png).*)",
  ],
};
