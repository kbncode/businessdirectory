// Server-only: sniffs a file's actual signature ("magic bytes") instead of
// trusting the client-supplied MIME type or filename extension, which a
// disguised upload (e.g. a renamed .exe) can freely lie about.

interface Signature {
  mime: string;
  check: (buf: Buffer) => boolean;
}

const SIGNATURES: Signature[] = [
  {
    mime: "image/jpeg",
    check: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    check: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    mime: "image/webp",
    check: (b) => b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  },
  {
    mime: "application/pdf",
    check: (b) => b.length >= 5 && b.toString("ascii", 0, 5) === "%PDF-",
  },
  // Legacy .doc (OLE compound file).
  {
    mime: "application/x-ole-compound",
    check: (b) =>
      b.length >= 8 &&
      b[0] === 0xd0 &&
      b[1] === 0xcf &&
      b[2] === 0x11 &&
      b[3] === 0xe0 &&
      b[4] === 0xa1 &&
      b[5] === 0xb1 &&
      b[6] === 0x1a &&
      b[7] === 0xe1,
  },
  // .docx and other Office Open XML formats are zip archives.
  {
    mime: "application/zip",
    check: (b) => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07),
  },
];

export function sniffFileSignature(buffer: Buffer): string | null {
  for (const signature of SIGNATURES) {
    if (signature.check(buffer)) return signature.mime;
  }
  return null;
}

// Maps a claimed MIME type to the signature(s) considered valid evidence for
// it. DOCX shares the zip signature with plain zip/xlsx/pptx, so this isn't
// a perfect DOCX-vs-zip distinction — it's still a meaningful check against
// e.g. an executable or script renamed to look like a document.
const ACCEPTED_SIGNATURES_FOR: Record<string, string[]> = {
  "image/jpeg": ["image/jpeg"],
  "image/png": ["image/png"],
  "image/webp": ["image/webp"],
  "application/pdf": ["application/pdf"],
  "application/msword": ["application/x-ole-compound"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["application/zip"],
};

export function verifyFileSignature(buffer: Buffer, claimedType: string): boolean {
  const detected = sniffFileSignature(buffer);
  if (!detected) return false;

  const accepted = ACCEPTED_SIGNATURES_FOR[claimedType];
  if (!accepted) return false;

  return accepted.includes(detected);
}
