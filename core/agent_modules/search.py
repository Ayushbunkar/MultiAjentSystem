from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from agent_modules.llm import _get_llm


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
