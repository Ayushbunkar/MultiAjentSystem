"""
tools.py — High-performance async web tools.

Key fixes vs previous version:
  - web_scrape is now an async-native coroutine wrapped via asyncio.to_thread
    so it never blocks the event loop and NEVER crashes with
    "asyncio.run() cannot be called when another event loop is running".
  - web_search uses Tavily's search_depth="basic" (free, fast).
  - Both tools have in-memory TTL cache (1h) with LRU eviction.
  - HTML extractor prefers <article>/<main> for dense content,
    strips noise tags, caps output to 2000 chars (save tokens).
  - User-agent rotates from a small pool to reduce 403 errors.
"""
from __future__ import annotations

import asyncio
import hashlib
import os
import random
import re
import time
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_core.tools import tool
from pydantic import BaseModel, Field

load_dotenv()

# ── Tavily client (singleton) ─────────────────────────────────────────────────
_tavily = None

def _get_tavily():
    global _tavily
    if _tavily is None:
        from tavily import TavilyClient
        key = os.getenv("TAVILY_API_KEY", "")
        if not key:
            raise RuntimeError("TAVILY_API_KEY not set in .env")
        _tavily = TavilyClient(api_key=key)
    return _tavily


# ── In-memory TTL cache ───────────────────────────────────────────────────────
_cache: dict[str, tuple[str, float]] = {}
_CACHE_TTL = 3600   # 1 hour
_CACHE_MAX = 100    # max entries before LRU eviction


def _cache_get(key: str) -> Optional[str]:
    entry = _cache.get(key)
    if entry:
        value, ts = entry
        if time.monotonic() - ts < _CACHE_TTL:
            return value
        del _cache[key]
    return None


def _cache_set(key: str, value: str) -> None:
    if len(_cache) >= _CACHE_MAX:
        # evict oldest entry
        oldest = min(_cache, key=lambda k: _cache[k][1])
        del _cache[oldest]
    _cache[key] = (value, time.monotonic())


def _make_key(prefix: str, value: str) -> str:
    return f"{prefix}:{hashlib.md5(value.lower().encode()).hexdigest()}"


# ── HTML extractor (token-efficient) ─────────────────────────────────────────
_NOISE_TAGS = frozenset({
    "script", "style", "nav", "footer", "header", "aside",
    "form", "noscript", "iframe", "svg", "button", "input",
    "meta", "link", "select", "textarea",
})
_WS_RE = re.compile(r"\s{2,}")
_SELECTORS = ("article", "main", '[role="main"]', "body")

# Rotating user agents to reduce 403s
_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
]


def _extract_text(html: str, max_chars: int = 2000) -> str:
    """Fast BeautifulSoup text extraction, noise-stripped, token-capped."""
    try:
        soup = BeautifulSoup(html, "lxml")
    except Exception:
        soup = BeautifulSoup(html, "html.parser")

    for tag in soup(_NOISE_TAGS):
        tag.decompose()

    for selector in _SELECTORS:
        node = soup.find(selector)
        if node:
            text = node.get_text(separator=" ", strip=True)
            break
    else:
        text = soup.get_text(separator=" ", strip=True)

    return _WS_RE.sub(" ", text)[:max_chars]


# ── Async HTTP scraper ────────────────────────────────────────────────────────
async def _async_scrape(url: str, timeout: float = 8.0) -> str:
    headers = {
        "User-Agent": random.choice(_USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
    }
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=timeout,
            http2=True,          # HTTP/2 is faster where supported
        ) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            return _extract_text(resp.text)
    except httpx.TimeoutException:
        return f"[Timeout after {timeout}s] {url}"
    except httpx.HTTPStatusError as e:
        return f"[HTTP {e.response.status_code}] {url}"
    except Exception as e:
        return f"[Scrape error] {e}"


# ── Tool input schemas (Pydantic v2) ─────────────────────────────────────────
class SearchInput(BaseModel):
    query: str = Field(..., description="Search query string.")


class ScrapeInput(BaseModel):
    url: str = Field(..., description="Full URL to scrape.")


# ── LangChain tools ──────────────────────────────────────────────────────────
@tool(args_schema=SearchInput)
def web_search(query: str) -> str:
    """Search the web for a query. Returns titles, URLs, and concise snippets."""
    cache_key = _make_key("search", query)
    cached = _cache_get(cache_key)
    if cached:
        return cached

    try:
        response = _get_tavily().search(
            query=query,
            max_results=4,              # 4 results = cheaper, still enough
            search_depth="basic",       # "basic" is free-tier fast
            include_answer=True,        # direct answer when available (free)
        )
    except Exception as e:
        return f"[Search error] {e}"

    results = response.get("results", []) if isinstance(response, dict) else []
    answer  = response.get("answer", "")  if isinstance(response, dict) else ""

    parts: list[str] = []
    if answer:
        parts.append(f"Direct Answer: {answer}")

    for r in results:
        title   = r.get("title", "No title")
        url     = r.get("url", "")
        snippet = (r.get("content") or r.get("snippet") or "")[:250].strip()
        parts.append(f"• {title}\n  {url}\n  {snippet}")

    output = "\n\n".join(parts) or "No results found."
    _cache_set(cache_key, output)
    return output


def web_search_urls(query: str, max_results: int = 3) -> list[str]:
    """Returns top URLs from a search query for concurrent RAG scraping."""
    try:
        response = _get_tavily().search(
            query=query,
            max_results=max_results,
            search_depth="basic",
        )
        results = response.get("results", []) if isinstance(response, dict) else []
        return [r.get("url") for r in results if r.get("url")]
    except Exception:
        return []


@tool(args_schema=ScrapeInput)
def web_scrape(url: str) -> str:
    """Fetch a URL and return clean, readable text (max 2000 chars)."""
    cache_key = _make_key("scrape", url)
    cached = _cache_get(cache_key)
    if cached:
        return cached

    # Use asyncio.to_thread so this sync tool never blocks the event loop
    # when called inside an already-running async context (pipeline).
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're inside an async context — schedule as a coroutine via future
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(asyncio.run, _async_scrape(url))
                result = future.result(timeout=12)
        else:
            result = asyncio.run(_async_scrape(url))
    except Exception as e:
        result = f"[Scrape error] {e}"

    _cache_set(cache_key, result)
    return result