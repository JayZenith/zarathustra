export async function searchPapers(query: string): Promise<string> {
  return JSON.stringify({
    query,
    status: "stub",
    message: "Paper search is intentionally not implemented in v1 beyond the tool contract."
  });
}

export async function fetchPaper(url: string): Promise<string> {
  return JSON.stringify({
    url,
    status: "stub",
    message: "Paper fetch is intentionally not implemented in v1 beyond the tool contract."
  });
}
