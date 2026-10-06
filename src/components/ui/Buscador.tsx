import { Search } from "lucide-react";
import { useEffect, useState } from "react";

/** Buscador que espera 300 ms después de la última tecla antes de consultar. */
export function Buscador({
  valor,
  alBuscar,
  placeholder,
  etiqueta,
}: {
  valor: string;
  alBuscar: (texto: string) => void;
  placeholder: string;
  etiqueta: string;
}) {
  const [texto, setTexto] = useState(valor);
  const [valorPrevio, setValorPrevio] = useState(valor);

  // Si la URL cambia por fuera (Atrás), el campo la sigue (ajuste durante el render, sin efecto).
  if (valor !== valorPrevio) {
    setValorPrevio(valor);
    setTexto(valor);
  }

  useEffect(() => {
    if (texto === valor) return;
    const espera = setTimeout(() => {
      alBuscar(texto.trim());
    }, 300);
    return () => {
      clearTimeout(espera);
    };
  }, [texto, valor, alBuscar]);

  return (
    <div className="relative min-w-[220px] flex-1">
      <Search aria-hidden size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-neutro-600" />
      <input
        type="search"
        aria-label={etiqueta}
        placeholder={placeholder}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
        }}
        className="min-h-[44px] w-full rounded-md border border-divisor bg-superficie pr-3 pl-9 text-[15px] hover:border-tinta/45 focus-visible:border-acento focus-visible:outline-offset-0"
      />
    </div>
  );
}
