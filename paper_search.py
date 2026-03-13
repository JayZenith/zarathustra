from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote
from urllib.request import urlopen
import xml.etree.ElementTree as ET


ARXIV_API = "http://export.arxiv.org/api/query"
ATOM_NS = {"atom": "http://www.w3.org/2005/Atom"}


@dataclass(frozen=True)
class PaperCandidate:
    title: str
    url: str
    abstract: str
    authors: tuple[str, ...]
    published: str


def search_arxiv(query: str, limit: int = 5) -> list[PaperCandidate]:
    encoded = quote(query)
    url = f"{ARXIV_API}?search_query=all:{encoded}&start=0&max_results={limit}"
    with urlopen(url) as response:
        xml_text = response.read().decode("utf-8", errors="replace")

    root = ET.fromstring(xml_text)
    papers: list[PaperCandidate] = []
    for entry in root.findall("atom:entry", ATOM_NS):
        title = _node_text(entry, "atom:title")
        abstract = _node_text(entry, "atom:summary")
        url = _node_text(entry, "atom:id")
        published = _node_text(entry, "atom:published")
        authors = tuple(
            author.findtext("atom:name", default="", namespaces=ATOM_NS).strip()
            for author in entry.findall("atom:author", ATOM_NS)
        )
        papers.append(
            PaperCandidate(
                title=" ".join(title.split()),
                url=url,
                abstract=" ".join(abstract.split()),
                authors=authors,
                published=published,
            )
        )
    return papers


def _node_text(entry: ET.Element, path: str) -> str:
    node = entry.find(path, ATOM_NS)
    return "" if node is None or node.text is None else node.text.strip()
