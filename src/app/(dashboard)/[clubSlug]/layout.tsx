/**
 * LAYOUT — Panel del club (ruta `/{clubSlug}/...`)
 */
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SponsorFooter } from "@/components/layout/SponsorFooter";
import { ClubOperationalHeader } from "@/components/club/ClubOperationalHeader";
import { ClubFinanceStrip } from "@/components/club/ClubFinanceStrip";

export interface ClubContext {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  colorPrimario: string;
  colorSecundario: string;
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug, logo_url, color_primary, color_secondary")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    redirect("/");
  }

  const clubContext: ClubContext = {
    id: club.id,
    name: club.name,
    slug: club.slug,
    logoUrl: club.logo_url,
    colorPrimario: club.color_primary || "#1e3a5f",
    colorSecundario: club.color_secondary || "#fbbf24",
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-[#F5F5F5]"
      style={
        {
          "--club-primary": clubContext.colorPrimario,
          "--club-secondary": clubContext.colorSecundario,
        } as React.CSSProperties
      }
    >
      <ClubOperationalHeader club={clubContext} user={user} />
      <ClubFinanceStrip clubId={club.id} clubSlug={club.slug} />

      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="container mx-auto max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
        <SponsorFooter />
      </main>
    </div>
  );
}
