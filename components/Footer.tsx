import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-sand bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-stone sm:flex-row sm:items-center sm:justify-between">
        <span>&copy; {new Date().getFullYear()} KBN Business Directory. All rights reserved.</span>
        <nav className="flex gap-4">
          <Link href="/about" className="hover:text-ink">
            About
          </Link>
          <Link href="/contact" className="hover:text-ink">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
