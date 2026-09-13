import Image from "next/image";

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Image
        src="/kbn-logo.png"
        alt="KBN - Kadiya Business Networking"
        height={48}
        width={0}
        sizes="100vw"
        style={{ height: "48px", width: "auto" }}
      />
      <h1 className="font-display text-xl font-bold text-ink">You&apos;re offline</h1>
      <p className="text-sm text-stone">
        Some pages you&apos;ve already visited may still be available. Reconnect to see the latest listings.
      </p>
    </div>
  );
}
