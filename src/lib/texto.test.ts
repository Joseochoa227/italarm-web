import { cx } from "./clases";
import { inicial } from "./texto";

describe("inicial", () => {
  it("toma la primera letra en mayúscula", () => {
    expect(inicial("victor")).toBe("V");
    expect(inicial("  Jose Ochoa")).toBe("J");
    expect(inicial(undefined)).toBe("?");
    expect(inicial("")).toBe("?");
  });
});

describe("cx", () => {
  it("une las clases e ignora los valores falsos", () => {
    expect(cx("a", false, null, undefined, "b")).toBe("a b");
  });
});
