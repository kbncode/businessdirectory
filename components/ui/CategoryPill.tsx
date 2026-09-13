"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CategoryPillItem {
  label: string;
  value: string;
  href?: string;
}

export interface CategoryPillProps {
  items: CategoryPillItem[];
  active: string;
  onSelect?: (value: string) => void;
}

export function CategoryPill({ items, active, onSelect }: CategoryPillProps) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = item.value === active;
        const className = cn(
          "shrink-0 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
          isActive ? "bg-signalOrange text-ink" : "bg-sand text-stone hover:text-ink"
        );

        if (item.href) {
          return (
            <Link key={item.value} href={item.href} className={className}>
              {item.label}
            </Link>
          );
        }

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect?.(item.value)}
            className={className}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
