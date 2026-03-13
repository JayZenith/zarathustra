export function renderCyclesPane(cycles: Array<Record<string, unknown>>): string {
  if (cycles.length === 0) {
    return "recent cycles: none";
  }
  const lines = cycles.slice(0, 5).map((cycle) => {
    return `#${String(cycle.cycle_index)} ${String(cycle.status)} ${String(cycle.summary ?? "")}`.trim();
  });
  return ["recent cycles:", ...lines].join("\n");
}
