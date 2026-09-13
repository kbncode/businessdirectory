import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "category" | "pending" | "approved" | "rejected";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  category: "bg-sand text-stone",
  pending: "bg-sand text-stone",
  approved: "bg-approvedGreen/10 text-approvedGreen",
  rejected: "bg-rejectedRed/10 text-rejectedRed",
};

export function Badge({ className, variant = "category", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
