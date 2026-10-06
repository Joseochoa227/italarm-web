import { comprimirImagen, ErrorImagen, MENSAJES_IMAGEN, TAMANO_MAXIMO } from "./imagen";

/** jsdom no dibuja: se simulan createImageBitmap y canvas.toBlob. */
function simularLienzo({ webp = true, tamanoSalida = 1000, ancho = 3200, alto = 1600 } = {}) {
  const tipos: string[] = [];
  const cerrar = vi.fn();
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ width: ancho, height: alto, close: cerrar }),
  );
  const dibujar = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: dibujar,
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    tipo?: string,
  ) {
    tipos.push(tipo ?? "");
    const tipoReal = tipo === "image/webp" && !webp ? "image/png" : (tipo ?? "image/png");
    callback(new Blob([new Uint8Array(tamanoSalida)], { type: tipoReal }));
  });
  return { tipos, dibujar, cerrar };
}

const archivo = (tipo: string, tamano = 4000, nombre = "foto.jpg") =>
  new File([new Uint8Array(tamano)], nombre, { type: tipo });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("comprimirImagen (BF-14)", () => {
  it("reduce a 1600 px por lado y convierte a WebP", async () => {
    const { tipos, dibujar, cerrar } = simularLienzo();

    const resultado = await comprimirImagen(archivo("image/jpeg", 4000, "camara.jpg"), "foto");

    expect(resultado.type).toBe("image/webp");
    expect(resultado.name).toBe("camara.webp");
    expect(dibujar).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 800);
    expect(tipos).toEqual(["image/webp"]);
    expect(cerrar).toHaveBeenCalled();
  });

  it("sin WebP usa JPEG para fotos y PNG para el logo", async () => {
    const foto = simularLienzo({ webp: false });
    expect((await comprimirImagen(archivo("image/png"), "foto")).type).toBe("image/jpeg");
    expect(foto.tipos).toEqual(["image/webp", "image/jpeg"]);

    vi.restoreAllMocks();
    const logo = simularLienzo({ webp: false });
    expect((await comprimirImagen(archivo("image/png", 4000, "logo.png"), "logo")).type).toBe("image/png");
    expect(logo.tipos).toEqual(["image/webp", "image/png"]);
  });

  it("si comprimir no la achica, sube la original", async () => {
    simularLienzo({ tamanoSalida: 9000, ancho: 300, alto: 200 });
    const original = archivo("image/png", 4000, "chica.png");
    expect(await comprimirImagen(original, "foto")).toBe(original);
  });

  it("rechaza tipos que no son JPEG, PNG o WebP", async () => {
    await expect(comprimirImagen(archivo("application/pdf"), "foto")).rejects.toThrow(MENSAJES_IMAGEN.tipo);
    await expect(comprimirImagen(archivo("image/gif"), "foto")).rejects.toBeInstanceOf(ErrorImagen);
  });

  it("rechaza imágenes de más de 5 MB después de comprimir", async () => {
    simularLienzo({ tamanoSalida: TAMANO_MAXIMO + 1 });
    await expect(comprimirImagen(archivo("image/jpeg", TAMANO_MAXIMO + 10), "foto")).rejects.toThrow(
      MENSAJES_IMAGEN.tamano,
    );
  });

  it("explica si no puede leer la imagen", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("dañada")));
    await expect(comprimirImagen(archivo("image/jpeg"), "foto")).rejects.toThrow(MENSAJES_IMAGEN.lectura);
  });
});
