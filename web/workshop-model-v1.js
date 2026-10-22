// Frozen validation rules for workshop-fixed-project@1.
export function workshopModelCorrect(m, x) {
  if (!x || typeof x !== "object") return false;
  switch (m.kind) {
    case "balance":
      return x.value === m.b;
    case "sharing":
      return (
        Array.isArray(x.baskets) &&
        x.baskets.length === m.a &&
        x.baskets.every((n) => n === m.b)
      );
    case "array":
      return x.rows === m.a && x.columns === m.b;
    case "fraction":
      return (
        Array.isArray(x.selected) &&
        x.selected.length === m.take &&
        new Set(x.selected).size === m.take &&
        x.selected.every((n) => Number.isInteger(n) && n >= 0 && n < m.parts)
      );
    case "measure":
      return x.columns === m.a && x.rows === m.b && x.value === 2 * (m.a + m.b);
    case "data":
      return (
        Array.isArray(x.selected) &&
        x.selected.length === 2 &&
        x.selected.includes(0) &&
        x.selected.includes(1) &&
        x.value === m.b
      );
    case "pattern":
      return (
        Array.isArray(x.selected) &&
        x.selected.length === 2 &&
        x.selected[0] === m.a + 3 * m.step &&
        x.selected[1] === m.a + 4 * m.step
      );
    case "route":
      return (
        Array.isArray(x.path) &&
        x.path.length === 3 &&
        x.path.every((n, i) => m.paths[i].includes(n)) &&
        x.path.reduce((a, b) => a + b, 0) === m.target
      );
  }
  return false;
}
export function workshopModelShape(m, x) {
  if (
    !x ||
    typeof x !== "object" ||
    Array.isArray(x) ||
    Object.keys(x).some((k) => !Object.hasOwn(m.initial, k)) ||
    Object.keys(m.initial).some((k) => !Object.hasOwn(x, k))
  )
    return false;
  const integer = (n, max, min = 0) =>
    Number.isInteger(n) && n >= min && n <= max;
  if (Object.hasOwn(x, "value") && !integer(x.value, 60)) return false;
  if (
    Object.hasOwn(x, "rows") &&
    (!integer(x.rows, 10, 1) || !integer(x.columns, 10, 1))
  )
    return false;
  if (
    Object.hasOwn(x, "baskets") &&
    (!Array.isArray(x.baskets) ||
      x.baskets.length !== m.a ||
      x.baskets.some((n) => !integer(n, m.total)) ||
      x.baskets.reduce((a, b) => a + b, 0) > m.total)
  )
    return false;
  if (Object.hasOwn(x, "selected")) {
    const allowed =
      m.kind === "fraction"
        ? Array.from({ length: m.parts }, (_, i) => i)
        : m.kind === "data"
          ? [0, 1, 2]
          : m.tiles;
    if (
      !Array.isArray(x.selected) ||
      x.selected.length > (m.kind === "fraction" ? m.parts : 2) ||
      new Set(x.selected).size !== x.selected.length ||
      x.selected.some((n) => !allowed.includes(n))
    )
      return false;
  }
  if (
    Object.hasOwn(x, "path") &&
    (!Array.isArray(x.path) ||
      x.path.length !== 3 ||
      x.path.some((n, i) => n !== null && !m.paths[i].includes(n)))
  )
    return false;
  return true;
}
