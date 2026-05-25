from __future__ import annotations

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from agent_modules.llm import _get_llm


_QUERY_EXPANSION_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You are an expert research assistant. Your task is to take a user's search topic and generate 3 highly optimized, diverse search queries to maximize the breadth and quality of information retrieved from a search engine.\n"
     "RULES:\n"
     "1. Return ONLY the 3 search queries, one per line.\n"
     "2. Do NOT use bullet points, numbering, or introductory text.\n"
     "3. Make each query distinct in its approach (e.g., general, technical, analytical)."),
    ("human", "{topic}")
])


def get_query_expansion_chain():
    """Uses the fast 8B model to generate alternative search queries."""
    return _QUERY_EXPANSION_PROMPT | _get_llm(fast=True) | StrOutputParser()
