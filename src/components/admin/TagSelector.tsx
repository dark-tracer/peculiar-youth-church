import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface Props {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

export function TagSelector({ options, value, onChange, placeholder = "Add a tag" }: Props) {
  const available = options.filter((o) => !value.includes(o));

  return (
    <div className="space-y-2">
      <Select
        value=""
        onValueChange={(v) => {
          if (!v) return;
          if (!value.includes(v)) onChange([...value, v]);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {available.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">All tags selected</div>
          ) : (
            available.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() => onChange(value.filter((x) => x !== t))}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
