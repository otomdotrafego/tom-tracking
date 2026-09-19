"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type NavItem = { icon: string; label: string; href: string };
type NavGroup = { section: string; items: NavItem[] };

const navItems: NavGroup[] = [
  {
    section: "Visão geral",
    items: [
      { icon: "ti-layout-dashboard", label: "Painel", href: "/" },
      { icon: "ti-users", label: "Leads", href: "/leads" },
      { icon: "ti-route", label: "Jornadas", href: "/jornadas" },
      { icon: "ti-chart-bar", label: "Relatórios", href: "/relatorios" },
    ],
  },
  {
    section: "Canais",
    items: [
      { icon: "ti-brand-whatsapp", label: "WhatsApp", href: "/whatsapp" },
      { icon: "ti-brand-instagram", label: "Instagram", href: "/instagram" },
      { icon: "ti-brand-google", label: "Google Ads", href: "/google-ads" },
      { icon: "ti-brand-meta", label: "Meta Ads", href: "/meta-ads" },
    ],
  },
  {
    section: "Sistema",
    items: [
      { icon: "ti-plug", label: "Integrações", href: "/integracoes" },
      { icon: "ti-webhook", label: "Webhooks", href: "/webhooks" },
      { icon: "ti-settings", label: "Configurações", href: "/configuracoes" },
    ],
  },
];

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 8px", borderRadius: 5, cursor: "pointer",
        fontSize: 12,
        background: active ? "var(--s3)" : "transparent",
        color: active ? "var(--text)" : "var(--muted)",
      }}
    >
      <i className={`ti ${item.icon}`} style={{ fontSize: 14 }} />
      {item.label}
    </div>
  );
}

export default function Sidebar() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fecha sidebar ao navegar no mobile
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleTheme(t: "dark" | "light") {
    setTheme(t);
    if (t === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function navigate(href: string) {
    router.push(href);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <aside
      style={{
        width: 188, minWidth: 188,
        background: "var(--s1)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div style={{
        padding: "15px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, background: "var(--s4)",
            border: "1px solid var(--border2)", borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ stroke: "var(--sub)", fill: "none", strokeWidth: 2, strokeLinecap: "round" as const }}>
              <circle cx="6" cy="6" r="2" />
              <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", letterSpacing: -0.2 }}>
            Tom <span style={{ color: "var(--muted)", fontWeight: 400 }}>Tracking</span>
          </span>
        </div>
        {/* Botão fechar no mobile */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, lineHeight: 1 }}
          >
            <i className="ti ti-x" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: "8px 6px", flex: 1, overflowY: "auto" }}>
        {navItems.map((group) => (
          <div key={group.section}>
            <div style={{ fontSize: 10, color: "var(--muted)", padding: "10px 8px 3px", letterSpacing: "0.5px" }}>
              {group.section}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.label}
                item={item}
                active={isActive(item.href)}
                onClick={() => navigate(item.href)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Theme toggle */}
      <div style={{
        padding: 11, borderTop: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>Tema</span>
        <div style={{
          display: "flex", background: "var(--s2)",
          border: "1px solid var(--border)", borderRadius: 20, padding: 2, gap: 1,
        }}>
          <button
            onClick={() => toggleTheme("dark")}
            style={{
              border: "none", padding: "3px 7px", borderRadius: 16, fontSize: 11,
              cursor: "pointer",
              background: theme === "dark" ? "var(--s4)" : "transparent",
              color: theme === "dark" ? "var(--text)" : "var(--muted)",
            }}
          >
            <i className="ti ti-moon" style={{ fontSize: 10 }} />
          </button>
          <button
            onClick={() => toggleTheme("light")}
            style={{
              border: "none", padding: "3px 7px", borderRadius: 16, fontSize: 11,
              cursor: "pointer",
              background: theme === "light" ? "var(--s4)" : "transparent",
              color: theme === "light" ? "var(--text)" : "var(--muted)",
            }}
          >
            <i className="ti ti-sun" style={{ fontSize: 10 }} />
          </button>
        </div>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {/* Topbar mobile */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: 48, background: "var(--s1)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 20 }}
          >
            <i className="ti ti-menu-2" />
          </button>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
            Tom <span style={{ color: "var(--muted)", fontWeight: 400 }}>Tracking</span>
          </span>
          <div style={{ width: 28 }} />
        </div>

        {/* Overlay */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.5)",
            }}
          />
        )}

        {/* Drawer */}
        <div style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 201,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
        }}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
}
