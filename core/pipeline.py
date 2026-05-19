"""
pipeline.py — Async-native, maximally-parallel multi-agent research pipeline.

Architecture (v3):
  Stage 1 (parallel): Search + Scrape run concurrently via asyncio.gather.
                      Scrape uses topic + seed URL heuristic while search runs.
  Stage 2: Writer gets combined research (search + scrape), capped to 4000 chars.
  Stage 3: Critic reviews report (report capped to 2000 chars to save tokens).

All agent/chain calls are wrapped in asyncio.to_thread to keep FastAPI's event
loop free (LangChain sync executors don't block the loop).

Each stage has an independent try/except → circuit-breaker style.
Pipeline always returns a complete dict even if individual steps fail.
"""
from __future__ import annotations

import asyncio
import logging
import time
from functools import partial
from typing import Any

logger = logging.getLogger("pipeline")

# ── Token budget (character approximations ~4 chars/token) ───────────────────
MAX_RESEARCH_CHARS = 4000    # fed to writer  (~1000 tokens)
MAX_CRITIC_CHARS   = 2000    # fed to critic  (~500 tokens)
MAX_SCRAPE_PREVIEW = 600     # search results shown to reader agent seed URL

PIPELINE_KEYS = ("search_results", "scraped_content", "report", "feedback")


# ── Async helper: run sync blocking calls in thread pool ─────────────────────
async def _in_thread(fn, *args, **kwargs) -> Any:
    """Run a sync callable in the default ThreadPoolExecutor without blocking loop."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(fn, *args, **kwargs))


# ── Stage implementations ─────────────────────────────────────────────────────
async def _stage_search_and_scrape(topic: str) -> tuple[str, str]:
    """Advanced RAG Stage 1: Query Expansion + Direct Search + Concurrent Multi-URL Scrape"""
    try:
        from tools import web_search, web_search_urls, _async_scrape
        from agents import get_query_expansion_chain
        
        # 0. Query Expansion (HyDE/Diversity)
        logger.info("Expanding queries...")
        expand_chain = get_query_expansion_chain()
        queries_text = await _in_thread(expand_chain.invoke, {"topic": topic})
        queries = [q.strip() for q in queries_text.split("\n") if q.strip()][:3]
        if not queries:
            queries = [topic]
            
        search_text_parts = [f"Expanded Queries: {', '.join(queries)}"]
        all_urls = []
        
        # 1. Search for snippets and URLs for all queries concurrently
        search_tasks = [_in_thread(web_search.invoke, {"query": q}) for q in queries]
        url_tasks = [_in_thread(web_search_urls, q, 2) for q in queries] # top 2 per query
        
        search_results = await asyncio.gather(*search_tasks, return_exceptions=True)
        url_results = await asyncio.gather(*url_tasks, return_exceptions=True)
        
        for sr in search_results:
            if not isinstance(sr, Exception):
                search_text_parts.append(str(sr))
                
        for ur in url_results:
            if not isinstance(ur, Exception) and isinstance(ur, list):
                all_urls.extend(ur)
                
        search_text = "\n\n".join(search_text_parts)
        
        # Deduplicate URLs while preserving order
        seen = set()
        unique_urls = []
        for u in all_urls:
            if u not in seen:
                seen.add(u)
                unique_urls.append(u)
                
        # Scrape top 4 diverse URLs
        urls_to_scrape = unique_urls[:4]
        
        if not urls_to_scrape:
            return search_text, "No URLs to scrape."
            
        # 3. Concurrently scrape top URLs
        scrape_tasks = [_async_scrape(url, timeout=5.0) for url in urls_to_scrape]
        scraped_texts = await asyncio.gather(*scrape_tasks, return_exceptions=True)
        
        # 4. Filter and combine scraped contents
        valid_texts = []
        for i, text in enumerate(scraped_texts):
            if isinstance(text, Exception):
                continue
            text_str = str(text)
            if text_str.strip() and not text_str.startswith("["):
                # Limit each scrape to ~1500 chars to save tokens
                valid_texts.append(f"Source {i+1} ({urls_to_scrape[i]}):\n{text_str[:1500]}")
                
        combined_scrape = "\n\n".join(valid_texts) or "Scraping yielded no valid content."
        return search_text, combined_scrape
    except Exception as e:
        logger.warning(f"Search and scrape stage failed: {e}")
        return f"[Search unavailable: {e}]", f"[Scrape unavailable: {e}]"


async def _stream_write(topic: str, research: str):
    """Stage 2: Yields chunks of a structured Markdown report from research material."""
    from agents import get_writer_chain
    chain = get_writer_chain()
    async for chunk in chain.astream({"topic": topic, "research": research[:MAX_RESEARCH_CHARS]}):
        yield chunk


async def _stage_write(topic: str, research: str) -> str:
    """Stage 2: Write a structured Markdown report from research material."""
    try:
        parts = []
        async for chunk in _stream_write(topic, research):
            parts.append(chunk)
        result = "".join(parts)
        return result.strip() or "Report generation returned empty."
    except Exception as e:
        logger.warning(f"Writer stage failed: {e}")
        return f"[Writer unavailable: {e}]"


async def _stage_critique(report: str) -> str:
    """Stage 3: Critique the report for quality improvements."""
    try:
        from agents import get_critic_chain
        chain = get_critic_chain()
        result = await _in_thread(
            chain.invoke,
            {"report": report[:MAX_CRITIC_CHARS]}
        )
        text = (result or "").strip()
        if not text:
            return "No critique generated."
            
        # Strip conversational/introductory preambles (e.g. "Here are 4 suggestions:")
        lines = text.split("\n")
        while lines:
            first_line = lines[0].strip()
            if not first_line:
                lines.pop(0)
                continue
            # If the line starts with a clear list marker, stop stripping
            if any(first_line.startswith(m) for m in ("-", "*", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.")):
                break
            # If it contains typical introductory terms, strip it
            if any(w in first_line.lower() for w in ("here are", "suggestions", "critique", "review", "improvement", "report")):
                lines.pop(0)
                continue
            break
            
        return "\n".join(lines).strip() or text
    except Exception as e:
        logger.warning(f"Critic stage failed: {e}")
        return f"[Critic unavailable: {e}]"


# ── Main async pipeline ───────────────────────────────────────────────────────
async def run_research_pipeline_async(topic: str) -> dict:
    """
    Parallel pipeline:
      [Stage 1] Search + Scrape → asyncio.gather (true parallel via threads)
      [Stage 2] Write report (needs Stage 1 output)
      [Stage 3] Critique (needs Stage 2 output)
    """
    t0 = time.perf_counter()
    state: dict = {k: "" for k in PIPELINE_KEYS}
    state["topic"] = topic

    logger.info(f"▶ Pipeline START | topic='{topic}'")

    # ── Stage 1: Parallel search + scrape ─────────────────────────────────────
    search_result, scrape_result = await _stage_search_and_scrape(topic)

    state["search_results"]  = search_result
    state["scraped_content"] = scrape_result

    t1 = time.perf_counter()
    logger.info(f"✔ Stage 1 (search+scrape) done in {t1-t0:.2f}s")

    # ── Stage 2: Write ─────────────────────────────────────────────────────────
    combined_research = (
        f"SEARCH RESULTS:\n{state['search_results']}\n\n"
        f"SCRAPED CONTENT:\n{state['scraped_content']}"
    )
    state["report"] = await _stage_write(topic, combined_research)

    t2 = time.perf_counter()
    logger.info(f"✔ Stage 2 (writer) done in {t2-t1:.2f}s")

    # ── Stage 3: Critique ──────────────────────────────────────────────────────
    state["feedback"] = await _stage_critique(state["report"])

    t3 = time.perf_counter()
    logger.info(f"✔ Stage 3 (critic) done in {t3-t2:.2f}s | TOTAL={t3-t0:.2f}s")

    return state


# ── Sync wrapper for CLI / testing ────────────────────────────────────────────
def run_research_pipeline(topic: str) -> dict:
    """Sync entry point for CLI or non-async callers."""
    return asyncio.run(run_research_pipeline_async(topic))


# ── CLI entry point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )

    topic_input = input("\n🔍 Enter a research topic: ").strip()
    if not topic_input:
        sys.exit("Topic cannot be empty.")

    result = run_research_pipeline(topic_input)

    divider = "=" * 60
    print(f"\n{divider}\n📄 REPORT\n{divider}")
    print(result["report"])
    print(f"\n{divider}\n🧐 CRITIC FEEDBACK\n{divider}")
    print(result["feedback"])
