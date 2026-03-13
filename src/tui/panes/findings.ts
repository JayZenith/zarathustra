export function renderFindingsPane(findings: Array<Record<string, unknown>>): string {
  if (findings.length === 0) {
    return "findings: none";
  }
  const lines = findings.slice(0, 5).map((finding) => {
    return `- ${String(finding.title)}: ${String(finding.body)}`;
  });
  return ["findings:", ...lines].join("\n");
}
