import {
  Wheat,
  Building2,
  GraduationCap,
  Zap,
  Leaf,
  Landmark,
  Building,
  HeartPulse,
  Plane,
  Ship,
  Monitor,
  Factory,
  Clapperboard,
  HandHeart,
  Scissors,
  Briefcase,
  ShoppingBag,
  Trophy,
  Radio,
  Truck,
  Store,
  type LucideIcon,
} from "lucide-react";

// Matched by keyword against the category name rather than a fixed id map
// — main categories are seeded/admin-editable rows, not a hardcoded enum,
// so this degrades gracefully (falls back to Store) if names change.
const CATEGORY_ICON_RULES: { keyword: string; icon: LucideIcon }[] = [
  { keyword: "agriculture", icon: Wheat },
  { keyword: "construction", icon: Building2 },
  { keyword: "real estate", icon: Building2 },
  { keyword: "education", icon: GraduationCap },
  { keyword: "energy", icon: Zap },
  { keyword: "environmental", icon: Leaf },
  { keyword: "financial", icon: Landmark },
  { keyword: "government", icon: Building },
  { keyword: "healthcare", icon: HeartPulse },
  { keyword: "medical", icon: HeartPulse },
  { keyword: "hospitality", icon: Plane },
  { keyword: "tourism", icon: Plane },
  { keyword: "import", icon: Ship },
  { keyword: "export", icon: Ship },
  { keyword: "information technology", icon: Monitor },
  { keyword: "software", icon: Monitor },
  { keyword: "manufacturing", icon: Factory },
  { keyword: "media", icon: Clapperboard },
  { keyword: "entertainment", icon: Clapperboard },
  { keyword: "non-profit", icon: HandHeart },
  { keyword: "social services", icon: HandHeart },
  { keyword: "personal services", icon: Scissors },
  { keyword: "professional services", icon: Briefcase },
  { keyword: "retail", icon: ShoppingBag },
  { keyword: "sports", icon: Trophy },
  { keyword: "recreation", icon: Trophy },
  { keyword: "telecommunications", icon: Radio },
  { keyword: "transportation", icon: Truck },
  { keyword: "logistics", icon: Truck },
];

export function getCategoryIcon(categoryName: string): LucideIcon {
  const lower = categoryName.toLowerCase();
  const match = CATEGORY_ICON_RULES.find((rule) => lower.includes(rule.keyword));
  return match?.icon ?? Store;
}
