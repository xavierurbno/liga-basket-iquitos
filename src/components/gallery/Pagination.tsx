"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    startTransition(() => {
      router.push(`${baseUrl}?page=${page}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="flex items-center gap-2">
        {/* Botón Anterior */}
        {prevPage ? (
          <Link
            href={`${baseUrl}?page=${prevPage}`}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(prevPage);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:shadow-md active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 text-slate-300">
            <ChevronLeft className="h-5 w-5" />
          </div>
        )}

        {/* Info de Página */}
        <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-6 shadow-sm">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#005CEE]" />
          ) : (
            <p className="text-xs font-black uppercase tracking-widest text-[#1e3a5f]">
              Página <span className="text-[#005CEE]">{currentPage}</span> de <span className="text-slate-400">{totalPages}</span>
            </p>
          )}
        </div>

        {/* Botón Siguiente */}
        {nextPage ? (
          <Link
            href={`${baseUrl}?page=${nextPage}`}
            prefetch={true}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(nextPage);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:shadow-md active:scale-95"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 text-slate-300">
            <ChevronRight className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Mensaje Elegante si no hay más (en la última página) */}
      {currentPage === totalPages && (
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          No hay más fotos en esta sección
        </p>
      )}
    </div>
  );
}
