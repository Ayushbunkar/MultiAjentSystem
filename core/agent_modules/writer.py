from __future__ import annotations

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from agent_modules.llm import _get_llm


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
