import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-signalOrange text-ink hover:bg-signalOrange/90",
  secondary: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
  ghost: "bg-transparent text-ink hover:bg-sand",
};

export function buttonClasses(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-sm px-4 py-2 text-sm font-medium normal-case transition-colors",
    variantClasses[variant],
    className
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return <button ref={ref} className={buttonClasses(variant, className)} {...props} />;
  }
);
Button.displayName = "Button";
