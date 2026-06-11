import * as React from "react";
import { Label } from "@/components/ui/label";

export function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-[oklch(0.68_0.20_40)] ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

// Preset tag lists used by admin forms (dropdown selection).
export const TAG_PRESETS = {
  sermon: [
    "Faith", "Prayer", "Holy Spirit", "Identity", "Discipleship",
    "Worship", "Salvation", "Grace", "Hope", "Love", "Purpose", "Family",
  ],
  blog: [
    "Devotional", "Story", "Announcement", "Testimony", "Youth",
    "Family", "Outreach", "Encouragement", "Reflection",
  ],
  article: [
    "The Foundation", "Q&A", "Reflection", "Teaching",
    "Culture", "Apologetics", "Leadership", "Discipleship",
  ],
  artwork: [
    "Worship", "Identity", "Hope", "Faith", "Scripture",
    "Devotional", "Prayer", "Wallpaper", "Poster", "Flyer",
  ],
} as const;

export type TagKind = keyof typeof TAG_PRESETS;
