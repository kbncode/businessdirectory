// Hidden anti-spam field. Real users never see or fill this — positioned
// off-screen (not display:none, which some bots specifically check for) so
// it's still "visible" to naive scrapers that fill every field they find.
// Server-side handlers reject (silently, with a fake success) any submission
// where this has a value.
export function Honeypot({ name = "website_url" }: { name?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", left: "-9999px", top: "-9999px", width: 0, height: 0, overflow: "hidden" }}
    >
      <label htmlFor={name}>Website</label>
      <input type="text" id={name} name={name} tabIndex={-1} autoComplete="off" />
    </div>
  );
}
