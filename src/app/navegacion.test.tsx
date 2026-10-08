import { screen, within } from "@testing-library/react";

import { renderizarApp } from "@/test/renderizar";

describe("Navegación en computador (RF-01)", () => {
  it("muestra el menú lateral con las opciones en orden y marca la activa", async () => {
    renderizarApp({ ruta: "/compras" });

    const menu = await screen.findByRole("navigation", { name: "Menú principal" });
    const enlaces = within(menu).getAllByRole("link");
    expect(enlaces.map((e) => e.textContent)).toEqual([
      "Inicio",
      "Inventario",
      "Nueva venta",
      "Nueva instalación",
      "Compras",
      "Cotizaciones",
      "Clientes",
      "Reportes",
    ]);
    expect(within(menu).getByRole("link", { name: "Compras" })).toHaveAttribute("aria-current", "page");
    expect(within(menu).getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("button", { name: "Nuevo" })).not.toBeInTheDocument();
  });

  it("lleva a cada sección, que muestra en qué fase llega", async () => {
    const { usuario, router } = renderizarApp();

    await usuario.click(await screen.findByRole("link", { name: "Cotizaciones" }));

    expect(await screen.findByRole("heading", { name: "Cotizaciones" })).toBeInTheDocument();
    expect(screen.getByText("Esta sección llega en la Fase 5")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/cotizaciones");
  });

  it("el menú del usuario tiene Configuración, Usuarios, Cambiar contraseña y Cerrar sesión (W-01)", async () => {
    const { usuario, router } = renderizarApp();

    await usuario.click(await screen.findByRole("button", { name: "Menú de tu cuenta" }));
    const opciones = await screen.findAllByRole("menuitem");
    expect(opciones.map((o) => o.textContent)).toEqual([
      "Configuración",
      "Usuarios",
      "Cambiar contraseña",
      "Cerrar sesión",
    ]);
    expect(screen.getByRole("menu")).toHaveTextContent("jose@italarm.test");

    await usuario.click(screen.getByRole("menuitem", { name: "Configuración" }));
    expect(await screen.findByRole("heading", { name: "Configuración" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/configuracion");
  });

  it("una ruta que no existe muestra la página no encontrada", async () => {
    renderizarApp({ ruta: "/no-existe" });

    const titulo = await screen.findByRole("heading", { name: "No encontramos esta página" });
    expect(within(titulo.parentElement!).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
  });
});

describe("Navegación en celular (RF-03, RF-04)", () => {
  it("muestra la barra superior con la marca y la barra inferior con Nuevo (+)", async () => {
    renderizarApp({ escritorio: false });

    expect(await screen.findByRole("banner")).toHaveTextContent("ITALARM");
    const barra = screen.getByRole("navigation", { name: "Menú principal" });
    expect(
      within(barra)
        .getAllByRole("link")
        .map((e) => e.textContent),
    ).toEqual(["Inicio", "Inventario", "Clientes", "Reportes"]);
    expect(within(barra).getByRole("button", { name: "Nuevo" })).toBeInTheDocument();
    expect(screen.queryByText("Control interno")).not.toBeInTheDocument();
  });

  it("el botón Nuevo (+) abre las cuatro opciones de registro y lleva al formulario elegido", async () => {
    const { usuario, router } = renderizarApp({ escritorio: false });

    await usuario.click(await screen.findByRole("button", { name: "Nuevo" }));

    const hoja = await screen.findByRole("dialog", { name: "Registrar" });
    expect(
      within(hoja)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Nueva venta", "Nueva instalación", "Registrar compra", "Nueva cotización"]);

    await usuario.click(within(hoja).getByRole("button", { name: "Registrar compra" }));

    expect(await screen.findByRole("heading", { name: "Nueva compra" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/compras/nueva");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("el círculo con la inicial abre el menú del usuario", async () => {
    const { usuario } = renderizarApp({ escritorio: false });

    const boton = await screen.findByRole("button", { name: "Menú de tu cuenta" });
    expect(boton).toHaveTextContent("J");
    await usuario.click(boton);

    expect(await screen.findByRole("menuitem", { name: "Cerrar sesión" })).toBeInTheDocument();
  });
});

describe("Secciones pendientes (entregable de la Fase 0: menú vacío)", () => {
  it.each([
    ["/instalaciones/nueva", "Nueva instalación", 4],
    ["/cotizaciones", "Cotizaciones", 5],
    ["/cotizaciones/nueva", "Nueva cotización", 5],
    ["/reportes", "Reportes", 6],
  ])("%s muestra «%s» y la fase en que llega", async (ruta, titulo, fase) => {
    renderizarApp({ ruta });

    expect(await screen.findByRole("heading", { level: 1, name: titulo })).toBeInTheDocument();
    expect(screen.getByText(`Esta sección llega en la Fase ${fase}`)).toBeInTheDocument();
  });
});
