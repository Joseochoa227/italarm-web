import { CircleAlert } from "lucide-react";

/** Pantalla cuando falta configurar la app (por ejemplo VITE_API_URL). */
export function ErrorConfiguracion({ mensaje }: { mensaje: string }) {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-[520px] place-items-center p-6">
      <div
        role="alert"
        className="flex items-start gap-2 rounded-lg bg-peligro-100 p-6 text-sm text-peligro-900"
      >
        <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0 text-peligro-700" />
        <p className="m-0">{mensaje}</p>
      </div>
    </main>
  );
}
