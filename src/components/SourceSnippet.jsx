import { useEffect, useState } from "react";

/**
 * Shows REAL code from this project. Vite's import.meta.glob with ?raw
 * loads source files as strings on demand (each file is its own lazy chunk),
 * so examples can never drift out of sync with the code.
 */
const files = import.meta.glob(["/src/**/*.js", "/src/**/*.jsx"], { query: "?raw", import: "default" });

export function SourceSnippet({ file, match, lines = 14, label }) {
  const [snippet, setSnippet] = useState(null);

  useEffect(() => {
    let active = true; // ignore results if the component unmounted (race-safe effect)
    const load = files[`/src/${file}`];
    if (!load) {
      setSnippet({ start: 0, code: `// not found: src/${file}` });
      return;
    }
    load().then((raw) => {
      if (!active) return;
      const all = raw.split("\n");
      const i = Math.max(0, all.findIndex((l) => l.includes(match)));
      setSnippet({ start: i + 1, code: all.slice(i, i + lines).join("\n") });
    });
    return () => {
      active = false;
    };
  }, [file, match, lines]);

  return (
    <figure className="overflow-hidden rounded-lg border bg-muted">
      <figcaption className="flex justify-between gap-2 border-b px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
        <span className="truncate">{label ? `${label} · ` : ""}src/{file}</span>
        {snippet && <span>L{snippet.start}</span>}
      </figcaption>
      <pre className="max-h-80 overflow-auto p-3 font-mono text-[11px] leading-relaxed">
        <code>{snippet ? snippet.code : "Loading source…"}</code>
      </pre>
    </figure>
  );
}
