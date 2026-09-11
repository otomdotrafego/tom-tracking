"use client";
import { useState } from "react";

type NavItem = { icon: string; label: string };
type NavGroup = { section: string; items: NavItem[] };

const navItems: NavGroup[] = [
  {
    section: "Visão geral",
    items: [
      { icon: "ti-layout-dashboard", label: "Painel" },
      { icon: "ti-users", label: "Leads" },
      { icon: "ti-route", label: "Jornadas" },
      { icon: "ti-chart-bar", label: "Relatórios" },
    ],
  },
  {
    section: "Canais",
    items: [
      { icon: "ti-brand-whatsapp", label: "WhatsApp" },
      { icon: "ti-brand-instagram", label: "Instagram" },
      { icon: "ti-brand-google", label: "Google Ads" },
      { icon: "ti-brand-meta", label: "Meta Ads" },
    ],
  },
  {
    section: "Sistema",
    items: [
      { icon: "ti-plug", label: "Integrações" },
      { icon: "ti-webhook", label: "Webhooks" },
      { icon: "ti-settings", label: "Configurações" },
    ],
  },
];

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 5,
        cursor: "pointer",
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
  const [active, setActive] = useState("Painel");

  function toggleTheme(t: "dark" | "light") {
    setTheme(t);
    if (t === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }

  return (
    <aside
      style={{
        width: 188,
        minWidth: 188,
        background: "var(--s1)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "15px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            background: "var(--s4)",
            border: "1px solid var(--border2)",
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            style={{
              stroke: "var(--sub)",
              fill: "none",
              strokeWidth: 2,
              strokeLinecap: "round" as const,
            }}
          >
            <circle cx="6" cy="6" r="2" />
            <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text)",
            letterSpacing: -0.2,
          }}
        >
          Tom{" "}
          <span style={{ color: "var(--muted)", fontWeight: 400 }}>
            Tracking
          </span>
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: "8px 6px", flex: 1, overflowY: "auto" }}>
        {navItems.map((group) => (
          <div key={group.section}>
            <div
              style={{
                fontSize: 10,
                color: "var(--muted)",
                padding: "10px 8px 3px",
                letterSpacing: "0.5px",
              }}
            >
              {group.section}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.label}
                item={item}
                active={active === item.label}
                onClick={() => setActive(item.label)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Theme toggle */}
      <div
        style={{
          padding: 11,
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, color: "var(--muted)" }}>Tema</span>
        <div
          style={{
            display: "flex",
            background: "var(--s2)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: 2,
            gap: 1,
          }}
        >
          <button
            onClick={() => toggleTheme("dark")}
            style={{
              border: "none",
              padding: "3px 7px",
              borderRadius: 16,
              fontSize: 11,
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
              border: "none",
              padding: "3px 7px",
              borderRadius: 16,
              fontSize: 11,
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
}