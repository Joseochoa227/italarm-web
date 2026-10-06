import { screen, waitFor, within } from "@testing-library/react";

import { tasasVigentes, tasaVigente } from "@/test/datos";
import { renderizarApp } from "@/test/renderizar";
import { http, problema, servidor } from "@/test/servidor";

const sinNbsp = (t: string | null) => (t ?? "").replaceAll(" ", " ");

/** Bolívar sin registrar hoy: se usa el de ayer, con su aviso (RF-33). */
const SIN_BOLIVAR_HOY = tasasVigentes({
  bolivar: tasaVigente({
    id: 2,
    par: "USD_VES",
    valor: "50.000000",
    fecha: "2026-10-05",
    fuente: "MANUAL",
    esDeHoy: false,
    aviso: "No se ha registrado la tasa del bolívar de hoy. Se está usando la del 05/10/2026.",
  }),
});

function contarPeticiones(ruta: "/api/v1/tasas/vista-previa" | "/api/v1/tasas/ves") {
  const llamadas: unknown[] = [];
  servidor.events.on("request:start", ({ request }) => {
    if (new URL(request.url).pathname === ruta) llamadas.push(request);
  });
  return llamadas;
}

async function abrirRegistroVes(usuario: ReturnType<typeof renderizarApp>["usuario"]) {
  const aviso = await screen.findByText(/No se ha registrado la tasa del bolívar de hoy/);
  await usuario.click(
    within(aviso.closest("div[role=status]")!).getByRole("button", { name: "Registrar tasa del día" }),
  );
  return screen.findByRole("dialog", { name: "Tasa del bolívar de hoy" });
}

describe("Tasas vigentes (RF-30, RF-33)", () => {
  it("se ven en el recuadro del menú lateral", async () => {
    renderizarApp();
    const recuadro = await screen.findByRole("link", { name: /Tasas de hoy · 1 USD/ });
    await waitFor(() => {
      expect(recuadro).toHaveTextContent("3.912,45");
    });
    expect(recuadro).toHaveTextContent("50");
    expect(recuadro).toHaveAttribute("href", "/tasas");
  });

  it("se ven en la barra superior del celular", async () => {
    renderizarApp({ escritorio: false });
    const tasas = await screen.findByRole("link", { name: /Tasas de cambio: COP 3\.912,45, VES 50/ });
    expect(tasas).toBeInTheDocument();
  });

  it("CP-12: sin la tasa del bolívar de hoy se usa la última y aparece el aviso para registrarla", async () => {
    servidor.use(http.get("/api/v1/tasas/vigentes", ({ response }) => response(200).json(SIN_BOLIVAR_HOY)));
    renderizarApp({ ruta: "/clientes" });

    const aviso = await screen.findByText(/No se ha registrado la tasa del bolívar de hoy/);
    expect(
      within(aviso.closest("div[role=status]")!).getByRole("button", { name: "Registrar tasa del día" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Tasas de hoy/ })).toHaveTextContent("Actualizar tasa");
  });

  it("con las tasas de hoy no hay aviso", async () => {
    renderizarApp();
    await screen.findByRole("heading", { name: "Hola, Jose" });
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Tasas de hoy/ })).toHaveTextContent("3.912,45");
    });
    expect(screen.queryByRole("button", { name: "Registrar tasa del día" })).not.toBeInTheDocument();
  });

  it("si la TRM automática falló ofrece reintentar e ingresarla manualmente", async () => {
    servidor.use(
      http.get("/api/v1/tasas/vigentes", ({ response }) =>
        response(200).json(
          tasasVigentes({
            trmAutomaticaFallo: true,
            trm: tasaVigente({
              fecha: "2026-10-05",
              esDeHoy: false,
              aviso:
                "La consulta automática de la TRM falló. Se está usando la del 05/10/2026; puedes registrarla manualmente.",
            }),
          }),
        ),
      ),
      http.post("/api/v1/tasas/trm/consultar", ({ response }) =>
        response(200).json({ resultado: "FALLO", fecha: "2026-10-06", detalle: "Sin respuesta" }),
      ),
    );
    const { usuario } = renderizarApp();

    const aviso = (await screen.findByText(/La consulta automática de la TRM falló/)).closest(
      "div[role=status]",
    )!;
    await usuario.click(within(aviso as HTMLElement).getByRole("button", { name: "Reintentar consulta" }));
    expect(
      await screen.findByText("La consulta volvió a fallar. Puedes ingresar la TRM manualmente."),
    ).toBeVisible();

    await usuario.click(within(aviso as HTMLElement).getByRole("button", { name: "Ingresar TRM manual" }));
    expect(await screen.findByRole("dialog", { name: "TRM manual de hoy" })).toHaveTextContent(
      "Pesos por 1 USD",
    );
  });
});

describe("Registro de la tasa del bolívar (RF-35)", () => {
  beforeEach(() => {
    servidor.use(http.get("/api/v1/tasas/vigentes", ({ response }) => response(200).json(SIN_BOLIVAR_HOY)));
  });

  it("CP-10: si los dos valores no coinciden no se guarda y se pide digitarla de nuevo", async () => {
    const vistaPrevia = contarPeticiones("/api/v1/tasas/vista-previa");
    const registro = contarPeticiones("/api/v1/tasas/ves");
    const { usuario } = renderizarApp();
    const dialogo = await abrirRegistroVes(usuario);

    await usuario.type(within(dialogo).getByLabelText("Tasa"), "52,5");
    await usuario.type(within(dialogo).getByLabelText("Repite la tasa"), "52,6");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar tasa" }));

    expect(within(dialogo).getByRole("alert")).toHaveTextContent(
      "Los dos valores no coinciden. Digítala de nuevo.",
    );
    expect(vistaPrevia).toHaveLength(0);
    expect(registro).toHaveLength(0);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("CP-11: con variación mayor al límite exige aceptarla expresamente y la envía aceptada", async () => {
    let cuerpo: unknown;
    servidor.use(
      http.post("/api/v1/tasas/vista-previa", async ({ request, response }) => {
        expect(await request.json()).toEqual({ par: "USD_VES", valor: "500" });
        return response(200).json({
          anterior: "50.000000",
          nueva: "500",
          porcentaje: "900.00",
          limite: "5.00",
          superaLimite: true,
        });
      }),
      http.post("/api/v1/tasas/ves", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(201).json(
          tasaVigente({ id: 9, par: "USD_VES", valor: "500.000000", fuente: "MANUAL" }),
        );
      }),
    );
    const { usuario } = renderizarApp();
    const dialogo = await abrirRegistroVes(usuario);

    await usuario.type(within(dialogo).getByLabelText("Tasa"), "500");
    await usuario.type(within(dialogo).getByLabelText("Repite la tasa"), "500");

    const alerta = await within(dialogo).findByText(/La tasa cambia 900 %, más que el límite de 5 %/);
    expect(alerta).toBeVisible();
    expect(within(dialogo).getByText("Anterior").nextSibling).toHaveTextContent("50");
    const guardar = within(dialogo).getByRole("button", { name: "Guardar tasa" });
    expect(guardar).toBeDisabled();

    await usuario.click(within(dialogo).getByRole("checkbox", { name: "Confirmo la variación de 900 %" }));
    expect(guardar).toBeEnabled();
    await usuario.click(guardar);

    expect(await screen.findByText("Tasa registrada")).toBeVisible();
    expect(cuerpo).toEqual({ valor: "500", confirmacion: "500", aceptarVariacion: true });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("dentro del límite guarda sin pedir confirmación, con coma decimal (W-04)", async () => {
    let cuerpo: unknown;
    servidor.use(
      http.post("/api/v1/tasas/vista-previa", ({ response }) =>
        response(200).json({
          anterior: "50.000000",
          nueva: "51.25",
          porcentaje: "2.50",
          limite: "5.00",
          superaLimite: false,
        }),
      ),
      http.post("/api/v1/tasas/ves", async ({ request, response }) => {
        cuerpo = await request.json();
        return response(201).json(tasaVigente({ par: "USD_VES" }));
      }),
    );
    const { usuario } = renderizarApp();
    const dialogo = await abrirRegistroVes(usuario);

    await usuario.type(within(dialogo).getByLabelText("Tasa"), "51,25");
    expect(within(dialogo).getByText("Se guardará: 51,25")).toBeVisible();
    await usuario.type(within(dialogo).getByLabelText("Repite la tasa"), "51.25");
    expect(sinNbsp((await within(dialogo).findByText("Variación")).nextSibling!.textContent)).toBe("2,5 %");
    expect(within(dialogo).queryByRole("checkbox")).not.toBeInTheDocument();

    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar tasa" }));
    expect(await screen.findByText("Tasa registrada")).toBeVisible();
    expect(cuerpo).toEqual({ valor: "51.25", confirmacion: "51.25", aceptarVariacion: false });
  });

  it("valida el formato: separador de miles, vacío y cero", async () => {
    const { usuario } = renderizarApp();
    const dialogo = await abrirRegistroVes(usuario);

    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar tasa" }));
    expect(within(dialogo).getAllByText("Escribe la tasa.")).toHaveLength(2);

    await usuario.type(within(dialogo).getByLabelText("Tasa"), "3.912,45");
    expect(
      within(dialogo).getByText(/sin separador de miles/, { selector: "p.text-peligro-700" }),
    ).toBeVisible();

    await usuario.clear(within(dialogo).getByLabelText("Tasa"));
    await usuario.type(within(dialogo).getByLabelText("Tasa"), "0");
    expect(within(dialogo).getByText("La tasa debe ser mayor que 0.")).toBeVisible();
  });

  it("si ya hay tasa de hoy, ofrece corregirla", async () => {
    servidor.use(
      http.get("/api/v1/tasas/vigentes", ({ response }) =>
        response(200).json(
          tasasVigentes({
            bolivar: tasaVigente({
              id: 7,
              par: "USD_VES",
              valor: "50.000000",
              esDeHoy: true,
              aviso: "Desactualizada",
            }),
          }),
        ),
      ),
      http.post("/api/v1/tasas/vista-previa", ({ response }) =>
        response(200).json({
          anterior: "50.000000",
          nueva: "51",
          porcentaje: "2.00",
          limite: "5.00",
          superaLimite: false,
        }),
      ),
      http.post("/api/v1/tasas/ves", () =>
        problema(409, "TASA_YA_REGISTRADA", "Ya existe la tasa del bolívar de hoy."),
      ),
    );
    const { usuario } = renderizarApp();
    const aviso = (await screen.findByText("Desactualizada")).closest<HTMLElement>("div[role=status]")!;
    await usuario.click(within(aviso).getByRole("button", { name: "Registrar tasa del día" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.type(within(dialogo).getByLabelText("Tasa"), "51");
    await usuario.type(within(dialogo).getByLabelText("Repite la tasa"), "51");
    await within(dialogo).findByText("Variación");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar tasa" }));

    expect(await within(dialogo).findByText(/Ya hay una tasa del bolívar registrada hoy/)).toBeVisible();
    await usuario.click(within(dialogo).getByRole("button", { name: "Corregir tasa de hoy" }));
    expect(await screen.findByRole("dialog", { name: /Corregir USD\/VES del 06\/10\/2026/ })).toBeVisible();
  });
});

describe("Pantalla de tasas (RF-34, RF-36)", () => {
  const historialCop = [
    {
      id: 1,
      par: "USD_COP" as const,
      fecha: "2026-10-06",
      valor: "3912.450000",
      fuente: "SUPERFINANCIERA" as const,
      correcciones: [],
    },
    {
      id: 3,
      par: "USD_COP" as const,
      fecha: "2026-10-05",
      valor: "3900.000000",
      fuente: "SUPERFINANCIERA" as const,
      correcciones: [
        {
          automatica: true,
          valorAnterior: "3890.000000",
          valorNuevo: "3900.000000",
          corregidaEn: "2026-10-05T14:00:00Z",
          motivo: "Reemplazada por la TRM oficial",
        },
      ],
    },
  ];
  const historialVes = [
    {
      id: 2,
      par: "USD_VES" as const,
      fecha: "2026-10-06",
      valor: "50.000000",
      fuente: "MANUAL" as const,
      registradaPor: "Jose Ochoa",
      correcciones: [
        {
          automatica: false,
          valorAnterior: "5.000000",
          valorNuevo: "50.000000",
          corregidaPor: "Victor",
          corregidaEn: "2026-10-06T15:00:00Z",
          motivo: "Faltaba un cero",
        },
      ],
    },
  ];

  beforeEach(() => {
    servidor.use(
      http.get("/api/v1/tasas", ({ request, response }) => {
        const par = new URL(request.url).searchParams.get("par");
        const contenido = par === "USD_COP" ? historialCop : historialVes;
        return response(200).json({
          contenido,
          pagina: 0,
          tamano: 100,
          totalElementos: contenido.length,
          totalPaginas: 1,
        });
      }),
    );
  });

  it("muestra las tarjetas, el historial por fecha y las correcciones", async () => {
    renderizarApp({ ruta: "/tasas" });

    expect(await screen.findByRole("heading", { level: 1, name: "Tasas de cambio" })).toBeVisible();
    expect(
      await screen.findByText("Doble digitación y alerta si varía más del 5 % (configurable)."),
    ).toBeVisible();

    const tabla = await screen.findByRole("table");
    const filas = within(tabla).getAllByRole("row");
    expect(filas).toHaveLength(3);
    expect(filas[1]).toHaveTextContent("06/10/2026");
    expect(filas[1]).toHaveTextContent("3.912,45");
    expect(filas[1]).toHaveTextContent("50");
    expect(filas[2]).toHaveTextContent("05/10/2026");
    expect(filas[2]).toHaveTextContent("—");

    const correcciones = screen.getByRole("heading", { name: "Correcciones de tasas" }).parentElement!;
    const items = within(correcciones).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("USD/VES · 06/10/2026: 5 → 50");
    expect(items[0]).toHaveTextContent("Victor");
    expect(items[0]).toHaveTextContent("Faltaba un cero");
    expect(items[1]).toHaveTextContent("TRM oficial (automática)");
  });

  it("corrige una tasa del historial con motivo (RF-36)", async () => {
    let cuerpo: unknown;
    servidor.use(
      http.post("/api/v1/tasas/vista-previa", async ({ request, response }) => {
        expect(await request.json()).toEqual({ par: "USD_COP", valor: "3905", tasaId: 3 });
        return response(200).json({
          anterior: "3900.000000",
          nueva: "3905",
          porcentaje: "0.13",
          limite: "5.00",
          superaLimite: false,
        });
      }),
      http.post("/api/v1/tasas/{id}/corregir", async ({ params, request, response }) => {
        expect(params.id).toBe("3");
        cuerpo = await request.json();
        return response(200).json(historialCop[1]!);
      }),
    );
    const { usuario } = renderizarApp({ ruta: "/tasas" });

    await usuario.click(await screen.findByRole("button", { name: "Corregir USD/COP del 05/10/2026" }));
    const dialogo = await screen.findByRole("dialog", { name: "Corregir USD/COP del 05/10/2026" });
    await usuario.type(within(dialogo).getByLabelText("Tasa"), "3905");
    await usuario.type(within(dialogo).getByLabelText("Repite la tasa"), "3905");
    await usuario.type(
      within(dialogo).getByLabelText("Motivo de la corrección (opcional)"),
      "Error de digitación",
    );
    await within(dialogo).findByText("Variación");
    await usuario.click(within(dialogo).getByRole("button", { name: "Guardar tasa" }));

    expect(await screen.findByText("Tasa corregida")).toBeVisible();
    expect(cuerpo).toEqual({
      valor: "3905",
      confirmacion: "3905",
      aceptarVariacion: false,
      motivo: "Error de digitación",
    });
  });

  it("no repite el aviso general: cada tarjeta muestra el suyo", async () => {
    servidor.use(http.get("/api/v1/tasas/vigentes", ({ response }) => response(200).json(SIN_BOLIVAR_HOY)));
    renderizarApp({ ruta: "/tasas" });

    await screen.findByRole("table");
    expect(screen.getAllByText(/No se ha registrado la tasa del bolívar de hoy/)).toHaveLength(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar tasa del día" })).toBeVisible();
  });

  it("con la tasa del bolívar de hoy ofrece corregirla en lugar de registrarla", async () => {
    renderizarApp({ ruta: "/tasas" });
    expect(await screen.findByRole("button", { name: "Corregir tasa de hoy" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Registrar tasa del día" })).not.toBeInTheDocument();
  });

  it("si no hay tasas en el rango lo indica", async () => {
    servidor.use(
      http.get("/api/v1/tasas", ({ response }) =>
        response(200).json({ contenido: [], pagina: 0, tamano: 100, totalElementos: 0, totalPaginas: 0 }),
      ),
    );
    renderizarApp({ ruta: "/tasas" });
    expect(await screen.findByText("No hay tasas registradas en estas fechas.")).toBeVisible();
    expect(screen.getByText("No hay correcciones en estas fechas.")).toBeVisible();
  });
});
