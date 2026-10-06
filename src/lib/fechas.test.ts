import { hoyBogota, sumarDias } from "./fechas";

describe("fechas de negocio", () => {
  it("hoy en Bogotá aunque en UTC ya sea mañana", () => {
    expect(hoyBogota(new Date("2026-10-07T03:00:00Z"))).toBe("2026-10-06");
    expect(hoyBogota(new Date("2026-10-07T05:00:00Z"))).toBe("2026-10-07");
  });

  it("suma y resta días cruzando meses y años", () => {
    expect(sumarDias("2026-10-06", -29)).toBe("2026-09-07");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(sumarDias("2024-03-01", -1)).toBe("2024-02-29");
  });
});
