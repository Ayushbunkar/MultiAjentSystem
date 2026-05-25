from __future__ import annotations

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from agent_modules.llm import _get_llm


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
