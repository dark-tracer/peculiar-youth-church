import { Link } from "@tanstack/react-router";
import { Sparkles, Mail, Phone, MapPin, Instagram, Facebook, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface mt-24">
      <div className="container-x py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-brand-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display font-bold">Peculiar Youth & Children Ministry</span>
          </Link>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            A place where the next generation discovers Jesus, builds real friendships, and lives out their God-given purpose.
          </p>
          <div className="mt-5 flex gap-3 text-muted-foreground">
            <a href="#" aria-label="Instagram" className="hover:text-brand"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="Facebook" className="hover:text-brand"><Facebook className="h-5 w-5" /></a>
            <a href="#" aria-label="YouTube" className="hover:text-brand"><Youtube className="h-5 w-5" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-brand">About</Link></li>
            <li><Link to="/sermons" className="hover:text-brand">Sermons</Link></li>
            <li><Link to="/events" className="hover:text-brand">Events</Link></li>
            <li><Link to="/gallery" className="hover:text-brand">Gallery</Link></li>
            <li><Link to="/blog" className="hover:text-brand">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-brand" /> 123 Hope Avenue, Lagos, NG</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand" /> +234 800 000 0000</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand" /> hello@peculiaryouth.org</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-x py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Peculiar Youth & Children Ministry. All rights reserved.</p>
          <p className="italic">Raising a peculiar generation for Christ.</p>
        </div>
      </div>
    </footer>
  );
}
