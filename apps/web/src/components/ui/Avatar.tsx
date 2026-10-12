/** Initials avatar (no photos of people). Skips honorifics like "د." / "Dr." / "Eng.". */
const HONORIFICS = /^(د\.|أ\.|م\.|dr\.?|eng\.?|mr\.?|ms\.?|mrs\.?)$/i;

export function initials(name: string) {
  const parts = name.split(/\s+/).filter((p) => p && !HONORIFICS.test(p));
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]![0] ?? "" : "";
  // Arabic: separate letters with a thin space so they don't join into a word.
  return /[؀-ۿ]/.test(first + last) ? [first, last].filter(Boolean).join(" ") : (first + last).toUpperCase();
}

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`grid size-16 shrink-0 place-items-center rounded-full bg-brand-900 text-lg font-semibold text-accent ring-4 ring-brand-100 ${className}`}>
      {initials(name)}
    </span>
  );
}
