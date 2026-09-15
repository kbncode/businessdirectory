// lucide-react (as pinned in this project, ^1.44.0) dropped brand/logo
// icons entirely — Mail/Phone/Globe still exist there, but Facebook,
// Instagram, Twitter/X, and LinkedIn do not, under any name. Rather than
// downgrade lucide-react (used for ~20 other icons across the app) or pull
// in a whole brand-icon package for four glyphs, these are small inline
// SVGs matching lucide's own conventions (24x24, currentColor, className
// passthrough) so they drop into the same icon slots.

type IconProps = { className?: string };

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.25-1.5 1.55-1.5H16.5V4.35C16.05 4.3 15.15 4.2 14.1 4.2c-2.2 0-3.6 1.35-3.6 3.75V10.5H8v3h2.5V21h3Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TwitterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.9 3h3.1l-6.8 7.77L23.3 21h-6.3l-4.9-6.4L6.4 21H3.3l7.27-8.31L2.7 3h6.46l4.43 5.85L18.9 3Zm-1.1 16.17h1.72L7.3 4.74H5.45l12.35 14.43Z" />
    </svg>
  );
}

export function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.94 8.5H3.56V20.5H6.94V8.5ZM5.25 3.5A1.97 1.97 0 1 0 5.25 7.44 1.97 1.97 0 0 0 5.25 3.5ZM20.5 20.5H17.13V14.5C17.13 12.9 16.5 12 15.24 12 14.1 12 13.4 12.77 13.13 13.5C13.03 13.75 13 14.1 13 14.46V20.5H9.63S9.68 9.5 9.63 8.5H13V9.97C13.42 9.24 14.31 8.2 16.36 8.2 18.8 8.2 20.5 9.82 20.5 13.3V20.5Z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12s0-3.35-.43-4.96a2.78 2.78 0 0 0-1.96-1.96C17.98 4.65 12 4.65 12 4.65s-5.98 0-7.61.43A2.78 2.78 0 0 0 2.43 7.04C2 8.65 2 12 2 12s0 3.35.43 4.96a2.78 2.78 0 0 0 1.96 1.96c1.63.43 7.61.43 7.61.43s5.98 0 7.61-.43a2.78 2.78 0 0 0 1.96-1.96C22 15.35 22 12 22 12Zm-12 3.2V8.8L15.5 12 10 15.2Z" />
    </svg>
  );
}
