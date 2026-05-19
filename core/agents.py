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
        # Token caps: 768 for fast (search/critic don't need verbose),
        # 2048 for writer (needs room for a detailed structured report).
        max_tok = 768 if fast else 2048
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
            max_tokens=768 if fast else 2048,
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
         "You are an elite, highly-optimized research agent. "
         "Your goal is to rapidly locate reliable, authoritative information. "
         "Use web_search to find information. Use web_scrape ONLY if search snippets are insufficient.\n\n"
         "STRICT RULES FOR TOKEN EFFICIENCY AND SPEED:\n"
         "1. BE CONCISE. Do not add filler text or introductory sentences.\n"
         "2. Return your findings as a strict list of 3-5 high-density bullet points.\n"
         "3. Include the source URL for each finding.\n"
         "4. STOP executing immediately once you have 3 reliable sources.\n"
         "5. Never repeat the same search query. Pivot keywords if needed.\n"
         "6. Only extract the core facts relevant to the query."),
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
         "You are a specialized content extraction agent. Your purpose is to deep-dive into a specific URL and extract the maximum amount of relevant factual information, while minimizing token usage.\n\n"
         "STRICT EXTRACTION PROTOCOL:\n"
         "1. Scrape the URL and distill it into exactly 5-8 highly informative, data-rich bullet points.\n"
         "2. Ignore all UI elements, ads, navigation menus, and boilerplate text.\n"
         "3. Prioritize numbers, statistics, definitive claims, and core arguments.\n"
         "4. Output ONLY the bullet points. No preamble, no postscript."),
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
     "You are an expert technical writer and industry analyst. Your objective is to synthesize raw research data into a comprehensive, highly professional, and perfectly structured Markdown report.\n\n"
     "WRITING GUIDELINES:\n"
     "1. Use an authoritative, objective, and analytical tone.\n"
     "2. Synthesize information logically; do not merely list facts. Group related ideas together.\n"
     "3. Do NOT hallucinate. Rely strictly on the provided research material.\n"
     "4. Avoid fluff, filler words, or repetitive phrasing. Maximize information density.\n"
     "5. Output ONLY the Markdown report. Do not include conversational text.\n\n"
     "STRICT REQUIRED FORMAT:\n"
     "# [Comprehensive Title]\n\n"
     "## Executive Summary\n"
     "[1-2 paragraphs summarizing the core topic and primary conclusions]\n\n"
     "## Key Findings\n"
     "### [Sub-topic 1]\n"
     "- [Detailed finding with context]\n"
     "### [Sub-topic 2]\n"
     "- [Detailed finding with context]\n\n"
     "## Analytical Conclusion\n"
     "[Final synthesis and implications of the findings]\n\n"
     "## References\n"
     "[List of sources used, properly formatted]\n"),
    ("human",
     "Write a detailed research report on: {topic}\n\n"
     "Research material provided from previous agents:\n{research}\n\n"
     "Remember to strictly follow the required formatting and maximize the depth of the content while remaining concise."),
])


def get_writer_chain():
    """Uses the 70B model for higher-quality structured reports."""
    return _WRITER_PROMPT | _get_llm(fast=False) | StrOutputParser()


# ── Critic chain ──────────────────────────────────────────────────────────────
_CRITIC_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You are a rigorous, uncompromising research critic and editor. Your job is to analyze the generated report and provide highly specific, actionable feedback to improve its quality, accuracy, and formatting.\n\n"
     "CRITIQUE PROTOCOL (MAX 5 POINTS):\n"
     "1. Identify gaps in logic, missing context, or weak arguments.\n"
     "2. Point out any deviations from the required Markdown structure.\n"
     "3. Highlight repetitive text or 'fluff' that should be removed.\n"
     "4. DO NOT provide any conversational preamble (e.g., 'Here are my thoughts:').\n"
     "5. Start immediately with the first concrete bullet point.\n"
     "6. Use clear, direct language. Example: '- The Executive Summary lacks a definitive conclusion.'"),
    ("human",
     "Review this research report and give improvement suggestions:\n\n{report}"),
])


def get_critic_chain():
    """Uses the fast 8B model for quick critique — doesn't need 70B quality."""
    return _CRITIC_PROMPT | _get_llm(fast=True) | StrOutputParser()