import { cx } from "@/lib/clases";

/** Bloque gris animado mientras carga (BF-09). */
export function Esqueleto({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-md bg-neutro-200", className)} />;
}
