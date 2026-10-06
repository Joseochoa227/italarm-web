import { cx } from "@/lib/clases";

/** Clases del control según el prototipo (.input). */
export function clasesControl(error: string | undefined, extra?: string) {
  return cx(
    "bg-superficie text-tinta caret-acento min-h-[44px] w-full rounded-md border px-2.5 text-[15px]",
    "hover:border-tinta/45 focus-visible:border-acento focus-visible:outline-offset-0",
    "disabled:cursor-not-allowed disabled:opacity-60",
    error ? "border-peligro-700" : "border-divisor",
    extra,
  );
}
