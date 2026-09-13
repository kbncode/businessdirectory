import { cn } from "@/lib/utils";

export function SectionDivider({ className }: { className?: string }) {
  return <hr className={cn("border-t border-sand", className)} />;
}
