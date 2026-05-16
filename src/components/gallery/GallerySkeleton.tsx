import { Camera } from "lucide-react";

export function GallerySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-8 w-48 rounded-lg bg-slate-200" />
        <div className="h-6 w-24 rounded-full bg-slate-100" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
            <div className="flex aspect-4/3 items-center justify-center bg-slate-100">
              <Camera className="h-10 w-10 text-slate-200" />
            </div>
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-3 w-12 rounded bg-slate-100" />
                <div className="h-3 w-12 rounded bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
