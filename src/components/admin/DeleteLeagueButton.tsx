"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import { deleteLeagueAction } from "@/actions/leagues";
import { toast } from "sonner";

interface DeleteLeagueButtonProps {
  leagueId: string;
  leagueName: string;
}

export function DeleteLeagueButton({ leagueId, leagueName }: DeleteLeagueButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteLeagueAction(leagueId);
      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
      } else {
        toast.error("error" in result ? result.error : result.message);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-red-100 text-red-500 hover:bg-red-50 transition-colors shadow-sm group"
        title={`Eliminar liga ${leagueName}`}
      >
        <Trash2 size={12} className="group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Eliminar</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="absolute inset-0" 
            onClick={() => !loading && setIsOpen(false)} 
          />
          
          <div className="relative w-full max-w-md bg-white rounded-4xl p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 border border-slate-100">
            <button
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                <AlertTriangle size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                  ¿Eliminar <span className="text-red-600">Liga</span>?
                </h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  Estás a punto de eliminar permanentemente la liga <span className="font-bold text-slate-900">"{leagueName}"</span>. 
                  Esta acción no se puede deshacer y borrará todos los datos asociados.
                </p>
              </div>

              <div className="flex flex-col w-full gap-3 pt-4">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-red-200 hover:bg-red-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Borrando...</span>
                    </>
                  ) : (
                    <span>Confirmar Eliminación</span>
                  )}
                </button>
                
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
