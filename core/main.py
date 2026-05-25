"""
main.py — Optimized FastAPI server (v4).

Improvements over v2:
  - asyncio.Lock for thread-safe in-memory cache
  - GZip compression for all responses ≥ 500 bytes
  - Proper lifespan: warm-up both LLM tiers on startup
  - SSE stream now emits events AS EACH STAGE COMPLETES (not just
    "processing" then "complete" at the end) — true real-time UX
  - /api/health checks both Groq LLM tiers
  - /api/cache/clear requires POST (not GET) — follows REST principles
  - Structured Pydantic v2 request/response schemas
  - Request ID header (X-Request-ID) for tracing
  - httpx replaced with single reusable client via lifespan
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import sys
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

load_dotenv()

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("app")

# ── Shared async HTTP client (reused across requests) ─────────────────────────
_http_client: httpx.AsyncClient | None = None

# ── Thread-safe in-memory result cache ───────────────────────────────────────
_result_cache: dict[str, dict] = {}
_cache_lock   = asyncio.Lock()
_CACHE_TTL    = 3600   # 1 hour
_CACHE_MAX    = 30


def _topic_key(topic: str) -> str:
    return hashlib.md5(topic.strip().lower().encode()).hexdigest()


async def _cache_get(topic: str) -> dict | None:
    async with _cache_lock:
        key   = _topic_key(topic)
        entry = _result_cache.get(key)
        if entry and (time.monotonic() - entry["_ts"]) < _CACHE_TTL:
            return entry
        if key in _result_cache:
            del _result_cache[key]
    return None


async def _cache_set(topic: str, data: dict) -> None:
    async with _cache_lock:
        if len(_result_cache) >= _CACHE_MAX:
            oldest = min(_result_cache, key=lambda k: _result_cache[k]["_ts"])
            del _result_cache[oldest]
        _result_cache[_topic_key(topic)] = {**data, "_ts": time.monotonic()}


# ── Lifespan: warm-up both LLM tiers ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    global _http_client
    _http_client = httpx.AsyncClient(timeout=10.0)
    logger.info("🔧 Warming up LLM tiers…")
    try:
        from agent_modules.llm import _get_llm
        _get_llm(fast=True)   # cache llama-3.1-8b-instant
        _get_llm(fast=False)  # cache llama-3.3-70b-versatile
        logger.info("✅ Both LLM tiers cached")
    except Exception as e:
        logger.warning(f"⚠ LLM warm-up failed (will retry on first request): {e}")
    yield
    logger.info("🛑 Shutting down — closing HTTP client")
    await _http_client.aclose()


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Multi-Agent Research System",
    description=(
        "Parallel, token-efficient, async multi-agent research pipeline "
        "powered by Groq (llama-3.1-8b-instant + llama-3.3-70b-versatile)"
    ),
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Serve static UI from frontend/dist
_static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.isdir(_static_dir):
    # Mount assets folder at /assets to serve Vite chunks
    _assets_dir = os.path.join(_static_dir, "assets")
    if os.path.isdir(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")


# ── Request ID middleware ─────────────────────────────────────────────────────
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response


# ── Pydantic Schemas ──────────────────────────────────────────────────────────
class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500, description="Research topic")

    @field_validator("topic")
    @classmethod
    def strip_topic(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("topic cannot be empty")
        return v


class ResearchResponse(BaseModel):
    status:          str
    topic:           str
    search_results:  str
    scraped_content: str
    report:          str
    feedback:        str
    cached:          bool = False
    duration_ms:     int  = 0
    version:         str  = "3.0.0"


# ── Static routes ─────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def read_root():
    index = os.path.join(_static_dir, "index.html")
    if os.path.isfile(index):
        return FileResponse(index)
    return {"message": "Multi-Agent Research System v3.0", "docs": "/docs"}


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    path = os.path.join(_static_dir, "favicon.svg")
    if os.path.isfile(path):
        return FileResponse(path, media_type="image/svg+xml")
    return Response(status_code=204)


@app.get("/favicon.svg", include_in_schema=False)
async def favicon_svg():
    path = os.path.join(_static_dir, "favicon.svg")
    if os.path.isfile(path):
        return FileResponse(path, media_type="image/svg+xml")
    return Response(status_code=204)


# ── SSE streaming endpoint ────────────────────────────────────────────────────
async def _sse_pipeline(topic: str) -> AsyncIterator[str]:
    """
    Server-Sent Events stream — emits events AS each stage completes.
    Event schema: {"step": str, "status": str, "data": str}
    """
    from pipeline import (
        _stage_search_and_scrape,
        _stage_write,  _stage_critique,
        MAX_RESEARCH_CHARS,
    )

    def _event(step: str, status: str, data: str = "") -> str:
        return f"data: {json.dumps({'step': step, 'status': status, 'data': data})}\n\n"

    t0 = time.perf_counter()

    # Cache check
    cached = await _cache_get(topic)
    if cached:
        yield _event("cache", "hit")
        for key in ("search_results", "scraped_content", "report", "feedback"):
            yield _event(key, "complete", cached.get(key, ""))
        yield _event("done", "complete", json.dumps({"cached": True, "duration_ms": 0}))
        return

    try:
        # Stage 1: parallel search + scrape
        yield _event("search",  "processing")
        yield _event("scrape",  "processing")

        search_result, scrape_result = await _stage_search_and_scrape(topic)

        yield _event("search", "complete", search_result)
        yield _event("scrape", "complete", scrape_result)

        # Stage 2: write
        yield _event("report", "processing")
        combined = (
            f"SEARCH RESULTS:\n{search_result}\n\n"
            f"SCRAPED CONTENT:\n{scrape_result}"
        )
        
        from pipeline import _stream_write
        report_parts = []
        async for chunk in _stream_write(topic, combined):
            report_parts.append(chunk)
            yield _event("report_chunk", "streaming", chunk)
            
        report = "".join(report_parts)
        yield _event("report", "complete", report)

        # Stage 3: critique
        yield _event("feedback", "processing")
        feedback = await _stage_critique(report)
        yield _event("feedback", "complete", feedback)

        duration_ms = int((time.perf_counter() - t0) * 1000)
        result_data = {
            "search_results":  search_result,
            "scraped_content": scrape_result,
            "report":          report,
            "feedback":        feedback,
        }
        await _cache_set(topic, result_data)
        yield _event("done", "complete", json.dumps({"cached": False, "duration_ms": duration_ms}))

    except Exception as e:
        logger.exception("SSE pipeline error")
        yield _event("error", "error", str(e))


@app.get("/api/research/stream", summary="Real-time SSE pipeline stream")
async def research_stream(topic: str):
    """Stream pipeline progress as Server-Sent Events."""
    topic = topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic query param is required")
    if len(topic) > 500:
        raise HTTPException(status_code=400, detail="topic too long (max 500 chars)")

    return StreamingResponse(
        _sse_pipeline(topic),
        media_type="text/event-stream",
        headers={
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering": "no",
            "Connection":       "keep-alive",
        },
    )


# ── Standard JSON endpoint ────────────────────────────────────────────────────
@app.post("/api/research", response_model=ResearchResponse, summary="Run research pipeline")
async def research(req: ResearchRequest):
    """Run the full multi-agent research pipeline and return a JSON result."""
    topic = req.topic
    t0    = time.perf_counter()

    cached_result = await _cache_get(topic)
    if cached_result:
        logger.info(f"Cache HIT | topic='{topic}'")
        return ResearchResponse(
            status="success", topic=topic,
            search_results=cached_result.get("search_results", ""),
            scraped_content=cached_result.get("scraped_content", ""),
            report=cached_result.get("report", ""),
            feedback=cached_result.get("feedback", ""),
            cached=True, duration_ms=0,
        )

    try:
        from pipeline import run_research_pipeline_async
        result = await run_research_pipeline_async(topic)
        await _cache_set(topic, result)

        duration_ms = int((time.perf_counter() - t0) * 1000)
        logger.info(f"Pipeline complete | topic='{topic}' | {duration_ms}ms")

        return ResearchResponse(
            status="success", topic=topic,
            search_results=result.get("search_results", ""),
            scraped_content=result.get("scraped_content", ""),
            report=result.get("report", ""),
            feedback=result.get("feedback", ""),
            cached=False, duration_ms=duration_ms,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Research pipeline error")
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")


# ── Deep Health Check ─────────────────────────────────────────────────────────
@app.get("/api/health", summary="System health check")
async def health_check():
    """Check LLM tiers, Tavily key, internet, and cache stats."""
    checks: dict[str, dict] = {}

    # LLM — fast tier
    try:
        from agent_modules.llm import _get_llm
        llm = _get_llm(fast=True)
        resp = await asyncio.to_thread(llm.invoke, "Reply: OK")
        checks["llm_fast"] = {"status": "ok", "model": "llama-3.1-8b-instant",
                               "response": str(resp.content)[:30]}
    except Exception as e:
        checks["llm_fast"] = {"status": "error", "error": str(e)}

    # LLM — write tier
    try:
        from agent_modules.llm import _get_llm
        llm = _get_llm(fast=False)
        checks["llm_write"] = {"status": "ok", "model": "llama-3.3-70b-versatile"}
    except Exception as e:
        checks["llm_write"] = {"status": "error", "error": str(e)}

    # Tavily
    tavily_key = os.getenv("TAVILY_API_KEY", "")
    checks["tavily"] = {
        "status": "configured" if tavily_key else "missing",
        "key_prefix": (tavily_key[:8] + "…") if tavily_key else None,
    }

    # Internet
    try:
        r = await _http_client.get("https://www.google.com")
        checks["internet"] = {"status": "ok", "http_code": r.status_code}
    except Exception as e:
        checks["internet"] = {"status": "error", "error": str(e)}

    # Cache
    async with _cache_lock:
        checks["cache"] = {
            "entries": len(_result_cache),
            "max_entries": _CACHE_MAX,
        }

    overall = "healthy" if all(
        v.get("status") in ("ok", "configured") for v in checks.values()
    ) else "degraded"

    return {
        "status":    overall,
        "version":   "3.0.0",
        "python":    sys.version.split()[0],
        "checks":    checks,
        "timestamp": time.time(),
    }


@app.post("/api/cache/clear", summary="Clear result cache")
async def clear_cache():
    """Clear the in-memory result cache."""
    async with _cache_lock:
        count = len(_result_cache)
        _result_cache.clear()
    return {"cleared": count, "status": "ok"}


@app.get("/api/config", summary="Frontend public config")
async def get_config():
    """Returns public Supabase credentials for the frontend."""
    return {
        "supabase_url":      os.getenv("SUPABASE_URL", ""),
        "supabase_anon_key": os.getenv("SUPABASE_ANON_KEY", ""),
    }


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
        workers=1,
        loop="asyncio",
        http="h11",
    )
