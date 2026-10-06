import * as Radix from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";

/** Menú desplegable accesible (teclado y lector de pantalla) sobre Radix. */
export function Menu({
  disparador,
  children,
  lado = "bottom",
}: {
  disparador: ReactNode;
  children: ReactNode;
  lado?: "top" | "bottom";
}) {
  return (
    <Radix.Root>
      <Radix.Trigger asChild>{disparador}</Radix.Trigger>
      <Radix.Portal>
        <Radix.Content
          side={lado}
          align="end"
          sideOffset={6}
          className="z-40 flex min-w-[220px] flex-col rounded-lg border border-borde bg-tarjeta p-1.5 shadow-md"
        >
          {children}
        </Radix.Content>
      </Radix.Portal>
    </Radix.Root>
  );
}

export function OpcionMenu({
  icono,
  children,
  alElegir,
}: {
  icono?: ReactNode;
  children: ReactNode;
  alElegir: () => void;
}) {
  return (
    <Radix.Item
      onSelect={alElegir}
      className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-md px-3 text-sm outline-none data-[highlighted]:bg-acento-100 data-[highlighted]:text-acento-800"
    >
      {icono}
      {children}
    </Radix.Item>
  );
}

export function SeparadorMenu() {
  return <Radix.Separator className="my-1 h-px bg-divisor" />;
}

export function EncabezadoMenu({ children }: { children: ReactNode }) {
  return <Radix.Label className="px-3 py-2 text-sm">{children}</Radix.Label>;
}
