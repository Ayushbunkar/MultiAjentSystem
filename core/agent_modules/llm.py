from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv

load_dotenv()

# ── LLM tier constants ────────────────────────────────────────────────────────
_GROQ_FAST_MODEL  = "llama-3.1-8b-instant"       # fast
_GROQ_WRITE_MODEL = "llama-3.3-70b-versatile"    # high quality


@lru_cache(maxsize=2)
def _get_llm(fast: bool = True) -> Any:
    """
    Returns a cached ChatGroq instance.
      fast=True  → llama-3.1-8b-instant  (search, critic)
      fast=False → llama-3.3-70b-versatile (writer)
    Falls back to Mistral if GROQ_API_KEY is absent.
    """
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        from langchain_groq import ChatGroq
        model_id = _GROQ_FAST_MODEL if fast else _GROQ_WRITE_MODEL
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
