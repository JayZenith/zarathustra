from __future__ import annotations

from pathlib import Path

from experiment_db import DEFAULT_DB_PATH, ExperimentDB
from paper_fetch import fetch_arxiv_entry
from paper_search import PaperCandidate, search_arxiv
from paper_summarize import format_summary, summarize_paper


def add_note(
    *,
    title: str,
    summary: str,
    url: str = "",
    tags: str = "",
    query: str = "",
    db_path: Path = DEFAULT_DB_PATH,
) -> None:
    db = ExperimentDB(db_path)
    try:
        db.add_paper_note(title=title, summary=summary, url=url, tags=tags, query=query)
    finally:
        db.close()


def find_notes(topic: str, db_path: Path = DEFAULT_DB_PATH) -> list[str]:
    db = ExperimentDB(db_path)
    try:
        rows = db.paper_notes_by_tag(topic)
        return [
            f"{row['title']} | tags={row['tags']} | {row['summary']} | {row['url']}".strip(" |")
            for row in rows
        ]
    finally:
        db.close()


def search_and_store(
    *,
    query: str,
    topic: str,
    limit: int = 3,
    db_path: Path = DEFAULT_DB_PATH,
) -> list[PaperCandidate]:
    candidates = search_arxiv(query, limit=limit)
    for candidate in candidates:
        summary = summarize_paper(title=candidate.title, abstract=candidate.abstract, topic=topic)
        add_note(
            title=candidate.title,
            summary=format_summary(summary),
            url=candidate.url,
            tags=",".join(summary.tags),
            query=query,
            db_path=db_path,
        )
    return candidates


def fetch_and_store(*, url: str, topic: str, db_path: Path = DEFAULT_DB_PATH) -> None:
    paper = fetch_arxiv_entry(url)
    summary = summarize_paper(title=paper.title, abstract=paper.abstract, topic=topic)
    add_note(
        title=paper.title,
        summary=format_summary(summary),
        url=paper.url,
        tags=",".join(summary.tags),
        query=topic,
        db_path=db_path,
    )
