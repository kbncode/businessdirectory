import { cn } from "@/lib/utils";

export interface AdminToastValue {
  message: string;
  tone: "success" | "error";
}

interface AdminToastProps {
  toast: AdminToastValue;
  onDismiss: () => void;
}

// Shared inline banner for admin manager components — a light card with a
// colored left border, never a browser alert() and never a dark surface.
export function AdminToast({ toast, onDismiss }: AdminToastProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-sm border-l-4 bg-paper px-4 py-3 text-sm",
        toast.tone === "success" ? "border-approvedGreen text-approvedGreen" : "border-rejectedRed text-rejectedRed"
      )}
    >
      <span>{toast.message}</span>
      <button type="button" onClick={onDismiss} className="ml-4 shrink-0 text-xs underline">
        Dismiss
      </button>
    </div>
  );
}
