import { Mail, Phone, Globe, type LucideIcon } from "lucide-react";
import { FacebookIcon, InstagramIcon, TwitterIcon, LinkedinIcon, YoutubeIcon } from "./SocialIcons";

type IconComponent = LucideIcon | ((props: { className?: string }) => JSX.Element);

const ICON_MAP: Record<string, IconComponent> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
  mail: Mail,
  phone: Phone,
  globe: Globe,
};

export function resolveFooterIcon(icon: string | null): IconComponent | null {
  if (!icon) return null;
  return ICON_MAP[icon] ?? null;
}
