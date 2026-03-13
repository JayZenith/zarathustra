from __future__ import annotations

from dataclasses import dataclass
from urllib.request import urlopen
import xml.etree.ElementTree as ET


ATOM_NS = {"atom": "http://www.w3.org/2005/Atom"}


@dataclass(frozen=True)
class PaperDocument:
    title: str
    url: str
    abstract: str
    authors: tuple[str, ...]
    published: str


def fetch_arxiv_entry(url: str) -> PaperDocument:
    api_url = _to_api_url(url)
    with urlopen(api_url) as response:
        xml_text = response.read().decode("utf-8", errors="replace")

    root = ET.fromstring(xml_text)
    entry = root.find("atom:entry", ATOM_NS)
    if entry is None:
        raise ValueError(f"No paper entry found for {url}")

    title = _node_text(entry, "atom:title")
    abstract = _node_text(entry, "atom:summary")
    published = _node_text(entry, "atom:published")
    authors = tuple(
        author.findtext("atom:name", default="", namespaces=ATOM_NS).strip()
        for author in entry.findall("atom:author", ATOM_NS)
    )
    return PaperDocument(
        title=" ".join(title.split()),
        url=url,
        abstract=" ".join(abstract.split()),
        authors=authors,
        published=published,
    )


def _to_api_url(url: str) -> str:
    if "export.arxiv.org/api/query?id_list=" in url:
        return url
    paper_id = url.rstrip("/").split("/")[-1]
    return f"http://export.arxiv.org/api/query?id_list={paper_id}"


def _node_text(entry: ET.Element, path: str) -> str:
    node = entry.find(path, ATOM_NS)
    return "" if node is None or node.text is None else node.text.strip()
