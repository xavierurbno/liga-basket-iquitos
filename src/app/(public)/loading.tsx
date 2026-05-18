import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";

export default function PublicPortalLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5] animate-pulse">
      <div className="h-36 border-b border-slate-200 bg-white" />
      <main className={`flex flex-1 flex-col gap-6 py-8 ${PORTAL_SHELL_CLASS}`}>
        <div className="aspect-16/7 w-full rounded-2xl bg-slate-200" />
        <div className="h-40 rounded-2xl bg-slate-200" />
      </main>
    </div>
  );
}
