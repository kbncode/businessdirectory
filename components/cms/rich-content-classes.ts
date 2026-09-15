// Shared Tailwind classes applied to CMS rich-text HTML, wherever it's
// rendered — the Tiptap editor surface and the public page both use this so
// what admins see while editing matches what visitors see. No typography
// plugin: the design system only has a couple of type styles to cover, so
// arbitrary child selectors are simpler than pulling in a whole plugin.
export const richContentClasses = [
  "[&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:first:mt-0",
  "[&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-ink [&_h3]:mt-6 [&_h3]:mb-2",
  "[&_p]:font-body [&_p]:text-ink [&_p]:leading-relaxed [&_p]:mb-4",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:font-body [&_ul]:text-ink",
  "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:font-body [&_ol]:text-ink",
  "[&_li]:mb-1",
  "[&_a]:text-signalOrange [&_a]:underline [&_a]:underline-offset-2",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-sand [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-stone [&_blockquote]:my-4",
  "[&_strong]:font-semibold",
].join(" ");
