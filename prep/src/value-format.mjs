// Display arrays on one line without changing strings or the stored test data.
export function formatValue(value, depth = 0) {
  if (Array.isArray(value))
    return `[${value.map((item) => formatInline(item)).join(", ")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return "{}";
    const indent = "  ".repeat(depth + 1);
    return `{\n${entries.map(([key, item]) => `${indent}${JSON.stringify(key)}: ${formatValue(item, depth + 1)}`).join(",\n")}\n${"  ".repeat(depth)}}`;
  }
  return JSON.stringify(value);
}

function formatInline(value) {
  if (Array.isArray(value)) return `[${value.map(formatInline).join(", ")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .map(([key, item]) => `${JSON.stringify(key)}: ${formatInline(item)}`)
      .join(", ")}}`;
  return JSON.stringify(value);
}

export function formatArguments(values, parameters = []) {
  if (!values.length) return "(no arguments)";
  return values
    .map(
      (value, i) =>
        `${parameters[i]?.name || `arg${i + 1}`} = ${formatValue(value)}`,
    )
    .join("\n");
}

export function formatExample(source, language = "") {
  if ((!language || language === "language-json") && /^\s*[\[{]/.test(source)) {
    try {
      return formatValue(JSON.parse(source));
    } catch {}
  }
  return source;
}
