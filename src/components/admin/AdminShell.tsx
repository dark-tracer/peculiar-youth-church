import { useEffect, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Mic2,
  FileText,
  Newspaper,
  BookOpen,
  Palette,
  Image as ImageIcon,
  Users,
  Settings,
  Inbox,
  LogOut,
  Menu,
  X,
  CalendarDays,
  FileEdit,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  superAdminOnly?: boolean;
};

const allNavItems: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/review", label: "Pending Review", icon: Inbox, superAdminOnly: true },
  { to: "/admin/sermons", label: "Sermons", icon: Mic2, superAdminOnly: true },
  { to: "/admin/blog", label: "Blog Posts", icon: FileText },
  { to: "/admin/articles", label: "Articles", icon: Newspaper },
  { to: "/admin/bible-studies", label: "Bible Studies", icon: BookOpen, superAdminOnly: true },
  { to: "/admin/events", label: "Events", icon: CalendarDays },
  { to: "/admin/artworks", label: "Digital Artworks", icon: Palette },
  { to: "/admin/media", label: "Media Library", icon: ImageIcon, superAdminOnly: true },
  { to: "/admin/team", label: "Team Members", icon: Users, superAdminOnly: true },
  { to: "/admin/settings", label: "Settings", icon: Settings, superAdminOnly: true },
];

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { fullName, user, role, email } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = allNavItems.filter(
    (item) => !item.superAdminOnly || role === "super_admin",
  );

  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        toast.info("Signed out due to inactivity");
        navigate({ to: "/admin/login" });
      }, IDLE_TIMEOUT_MS);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user, navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  return (
    <div className="min-h-screen bg-[oklch(0.16_0.02_260)] text-foreground" data-admin>
      <style>{`
        [data-admin] { color-scheme: dark; }
        [data-admin] { --background: oklch(0.16 0.02 260); --foreground: oklch(0.96 0.01 250); --card: oklch(0.21 0.03 260); --card-foreground: oklch(0.96 0.01 250); --muted: oklch(0.25 0.03 260); --muted-foreground: oklch(0.70 0.02 250); --border: oklch(0.30 0.03 260 / 60%); --input: oklch(0.30 0.03 260 / 60%); --popover: oklch(0.21 0.03 260); --popover-foreground: oklch(0.96 0.01 250); --secondary: oklch(0.25 0.03 260); --secondary-foreground: oklch(0.96 0.01 250); --accent: oklch(0.28 0.06 35); --accent-foreground: oklch(0.96 0.01 250); --primary: oklch(0.68 0.20 40); --primary-foreground: oklch(0.10 0.01 250); --ring: oklch(0.68 0.20 40); }
      `}</style>

      <div className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <Link to="/admin/dashboard" className="font-display font-bold">
          PYCM <span className="text-[oklch(0.68_0.20_40)]">Admin</span>
        </Link>
        <button
          aria-label="menu"
          className="rounded-md p-2 hover:bg-muted"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex">
        <aside
          className={`${mobileOpen ? "block" : "hidden"} md:block fixed md:sticky md:top-0 inset-x-0 md:inset-auto top-14 md:top-0 z-30 md:h-screen w-full md:w-64 shrink-0 border-r border-border bg-card md:bg-[oklch(0.18_0.025_260)]`}
        >
          <div className="hidden md:flex h-16 items-center gap-2 border-b border-border px-5">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] font-bold">
              P
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-sm">PYCM</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin Console</div>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5 p-3">
            {navItems.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-[oklch(0.68_0.20_40)] text-[oklch(0.10_0.01_250)] font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">
              <div className="font-semibold text-foreground truncate">{fullName ?? email ?? user?.email}</div>
              <div className="uppercase tracking-wide text-[10px] mt-0.5">
                {role === "super_admin" ? "Super Admin" : role === "editor" ? "Editor" : "—"}
              </div>
            </div>
            <button
              onClick={signOut}
              className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 min-h-screen">
          <div className="p-5 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
