/**
 * ============================================================
 * SIDEBAR - Navegación Principal
 * ============================================================
 * Marcado como "use client" porque necesita:
 * - usePathname() para resaltar el ítem activo
 * - useState() para el colapso en mobile
 * - Framer Motion para animaciones de hover/active
 *
 * En RSC, los datos del club vienen como props desde el layout.
 * El Sidebar NO hace fetch propio — recibe lo que necesita.
 * ============================================================
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { ClubContext } from "@/app/(dashboard)/[clubSlug]/layout";

// ─────────────────────────────────────────────────────────────
// ICONOS SVG INLINE
// Usamos SVGs inline (no librería) para máximo rendimiento —
// cero bundle overhead. Solo los iconos que necesitamos.
// ─────────────────────────────────────────────────────────────

const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Jugadores: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  ),
  Caja: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
  Documentos: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  ),
  Torneos: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path d="M8 21h8M12 17v4M17 3H7l-2 7h14L17 3zM5 10s0 4 7 4 7-4 7-4" />
    </svg>
  ),
  Reportes: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Config: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  ),
  Ball: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93C6.36 7.64 7 10.27 7 12s-.64 4.36-2.07 7.07" />
      <path d="M19.07 4.93C17.64 7.64 17 10.27 17 12s.64 4.36 2.07 7.07" />
      <path d="M2 12h20" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// ITEMS DE NAVEGACIÓN
// ─────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.FC;
  badge?: string; // Para notificaciones: "3 pendientes"
  section?: string;
}

function getNavItems(clubSlug: string): NavItem[] {
  const base = `/dashboard/${clubSlug}`;
  return [
    // SECCIÓN PRINCIPAL
    { label: "Panel de Control", href: base, icon: Icons.Dashboard, section: "principal" },
    { label: "Jugadores", href: `${base}/jugadores`, icon: Icons.Jugadores, section: "principal" },
    { label: "Caja", href: `${base}/caja`, icon: Icons.Caja, section: "principal" },
    { label: "Documentos", href: `${base}/documentos`, icon: Icons.Documentos, section: "principal" },
    // SECCIÓN COMPETICIÓN
    { label: "Torneos", href: `${base}/torneos`, icon: Icons.Torneos, section: "competicion" },
    { label: "Reportes", href: `${base}/reportes`, icon: Icons.Reportes, section: "competicion" },
    // SECCIÓN SISTEMA
    { label: "Configuración", href: `${base}/configuracion`, icon: Icons.Config, section: "sistema" },
  ];
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

interface SidebarProps {
  club: ClubContext;
}

export function Sidebar({ club }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = getNavItems(club.slug);

  // Determina si un ítem está activo (match exacto o prefijo para sub-rutas)
  const isActive = (href: string) => {
    if (href === `/dashboard/${club.slug}`) return pathname === href;
    return pathname.startsWith(href);
  };

  const sectionLabels: Record<string, string> = {
    principal: "Principal",
    competicion: "Competición",
    sistema: "Sistema",
  };

  // Agrupamos ítems por sección para renderizar separadores visuales
  const sections = ["principal", "competicion", "sistema"];

  return (
    <>
      {/* Overlay mobile */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCollapsed(true)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar container */}
      <motion.aside
        className="relative z-30 flex flex-col bg-[#0f2040] border-r border-white/5 shrink-0"
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* ── HEADER: Logo + nombre del club ── */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 min-h-[72px]">
          {/* Ícono de basketball como logo fallback */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[#0f2040]"
            style={{ backgroundColor: "var(--club-secondary, #fbbf24)" }}
          >
            <Icons.Ball />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <p className="text-white font-semibold text-sm leading-tight truncate max-w-[150px]">
                  {club.nombre}
                </p>
                <p className="text-white/40 text-xs">Liga de Basket</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── NAVEGACIÓN ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-6">
          {sections.map((section) => {
            const items = navItems.filter((i) => i.section === section);
            return (
              <div key={section}>
                {/* Etiqueta de sección — solo visible cuando sidebar está expandido */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2"
                    >
                      {sectionLabels[section]}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                      <Link key={item.href} href={item.href}>
                        <motion.div
                          whileHover={{ x: collapsed ? 0 : 2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                            transition-colors duration-150 cursor-pointer group
                            ${active
                              ? "bg-[var(--club-secondary,#fbbf24)]/15 text-[var(--club-secondary,#fbbf24)]"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                            }
                          `}
                        >
                          {/* Indicador activo */}
                          {active && (
                            <motion.div
                              layoutId="activeNav"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                              style={{ backgroundColor: "var(--club-secondary, #fbbf24)" }}
                            />
                          )}

                          {/* Ícono */}
                          <span className="shrink-0">
                            <Icon />
                          </span>

                          {/* Label */}
                          <AnimatePresence>
                            {!collapsed && (
                              <motion.span
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-sm font-medium whitespace-nowrap"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>

                          {/* Badge de notificación */}
                          {item.badge && !collapsed && (
                            <span className="ml-auto text-xs bg-amber-500 text-amber-950 font-semibold px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── FOOTER: Botón de colapso ── */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <motion.span
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Icons.ChevronRight />
            </motion.span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
