from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from agent_modules.llm import _get_llm


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
