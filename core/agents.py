"""
agents.py — Optimized agent definitions using Groq (free, ultra-fast).

Key optimizations:
  - Two separate LLM tiers: llama-3.1-8b-instant (search/critic, ~1000 tok/s)
    and llama-3.3-70b-versatile (writer only — better quality).
  - Each model is cached once via module-level singletons (lru_cache with bool
    args creates two independent cache entries, which is correct).
  - max_tokens capped per role → reduces cost & latency.
  - AgentExecutor max_iterations minimized per role.
  - Pydantic v2 tool input schemas for strict validation.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

load_dotenv()

# ── LLM tier constants ────────────────────────────────────────────────────────
# Free Groq models — pick fastest small model for search/critic,
# best quality model for report writing.
_GROQ_FAST_MODEL  = "llama-3.1-8b-instant"       # ~1000 tok/s, free
_GROQ_WRITE_MODEL = "llama-3.3-70b-versatile"    # best quality, free


# ── LLM factory (two cached singletons) ──────────────────────────────────────
@lru_cache(maxsize=2)
def _get_llm(fast: bool = True) -> Any:
    """
    Returns a cached ChatGroq instance.
      fast=True  → llama-3.1-8b-instant  (search, critic — ultra fast)
      fast=False → llama-3.3-70b-versatile (writer — higher quality)
    Falls back to Mistral if GROQ_API_KEY is absent.
    """
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        from langchain_groq import ChatGroq
        model_id = _GROQ_FAST_MODEL if fast else _GROQ_WRITE_MODEL
        # Token caps: 512 for fast (search/critic don't need verbose),
        # 1200 for writer (needs room for a structured report).
        max_tok = 512 if fast else 1200
        return ChatGroq(
            api_key=groq_key,
            model=model_id,
            temperature=0.2,
            max_tokens=max_tok,
        )

    mistral_key = os.getenv("MISTRAL_API_KEY")
    if mistral_key:
        from langchain_mistralai import ChatMistralAI
        return ChatMistralAI(
            api_key=mistral_key,
            model="mistral-small-latest",
            temperature=0.2,
            max_tokens=768 if fast else 1200,
        )

    raise RuntimeError(
        "No LLM API key found. Set GROQ_API_KEY (or MISTRAL_API_KEY) in .env"
    )


# ── Pydantic v2 tool input schemas ────────────────────────────────────────────
class WebSearchInput(BaseModel):
    query: str = Field(..., description="The search query to look up on the web.")


class WebScrapeInput(BaseModel):
    url: str = Field(..., description="The full URL to scrape content from.")


# ── Search agent ──────────────────────────────────────────────────────────────
def build_search_agent():
    """
    Research agent: uses web_search (+ web_scrape as fallback).
    Uses the fast 8B model — search/summarize only needs speed.
    max_iterations=3 → avoids runaway LLM loops (saves tokens).
    """
    from langchain.agents import create_tool_calling_agent, AgentExecutor
    from tools import web_search, web_scrape

    llm = _get_llm(fast=True)
    tools = [web_search, web_scrape]

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a fast research agent. "
         "Use web_search to find info. Only use web_scrape if search snippets are insufficient.\n"
         "Rules:\n"
         "• Be concise — return bullet points with URLs.\n"
         "• Stop as soon as you have 3+ reliable sources.\n"
         "• Never repeat the same search query."),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(llm=llm, tools=tools, prompt=prompt)
    return AgentExecutor(
        agent=agent,
        tools=tools,
        max_iterations=3,
        handle_parsing_errors=True,
        early_stopping_method="generate",
        verbose=False,
        return_intermediate_steps=False,
    )


# ── Reader agent ──────────────────────────────────────────────────────────────
def build_reader_agent():
    """
    Reader agent: deep-dives into a single URL.
    Uses fast 8B model — summarization only.
    max_iterations=2 → one scrape + one synthesis call max.
    """
    from langchain.agents import create_tool_calling_agent, AgentExecutor
    from tools import web_scrape

    llm = _get_llm(fast=True)
    tools = [web_scrape]

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a content extraction agent. Scrape the given URL and return "
         "only the key facts in 5–8 bullet points. Be concise. Skip ads, navigation, footers."),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(llm=llm, tools=tools, prompt=prompt)
    return AgentExecutor(
        agent=agent,
        tools=tools,
        max_iterations=2,
        handle_parsing_errors=True,
        verbose=False,
        return_intermediate_steps=False,
    )


# ── Writer chain ──────────────────────────────────────────────────────────────
_WRITER_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You are a precise technical writer. Write clearly and concisely. "
     "Do not pad content. Use Markdown headers exactly as specified."),
    ("human",
     "Write a research report on: {topic}\n\n"
     "Research material:\n{research}\n\n"
     "Required format (strict):\n"
     "## Introduction\n"
     "## Key Findings\n"
     "- Finding 1\n- Finding 2\n- Finding 3\n"
     "## Conclusion\n"
     "## Sources\n"),
])


def get_writer_chain():
    """Uses the 70B model for higher-quality structured reports."""
    return _WRITER_PROMPT | _get_llm(fast=False) | StrOutputParser()


# ── Critic chain ──────────────────────────────────────────────────────────────
_CRITIC_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You are a strict research critic. Provide 3–5 specific, actionable "
     "improvement suggestions. Do not include any introductory sentences, conversational preamble, "
     "greetings, or filler text (such as 'Here are improvement suggestions...'). "
     "Start directly with the first concrete critique/suggestion. Format using clear markdown bullet points."),
    ("human",
     "Review this research report and give improvement suggestions:\n\n{report}"),
])


def get_critic_chain():
    """Uses the fast 8B model for quick critique — doesn't need 70B quality."""
    return _CRITIC_PROMPT | _get_llm(fast=True) | StrOutputParser()