from agents import build_reader_agent , build_search_agent , writer_chain , critic_chain


def _extract_last_message_text(agent_result) -> str:
    """Normalize LangChain agent output into plain text."""
    if not isinstance(agent_result, dict):
        return str(agent_result)

    messages = agent_result.get("messages", [])
    if not messages:
        return str(agent_result)

    last = messages[-1]
    content = getattr(last, "content", None)

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                if item.get("type") == "text":
                    parts.append(item.get("text", ""))
            elif isinstance(item, str):
                parts.append(str(item))
        return "\n".join([p for p in parts if p]).strip()

    if content is not None:
        return str(content)

    return str(last)

def run_research_pipeline(topic : str) -> dict:

    state = {
        "search_results": "",
        "scraped_content": "",
        "report": "",
        "feedback": "",
    }

    #search agent working 
    print("\n"+" ="*50)
    print("step 1 - search agent is working ...")
    print("="*50)

    try:
        search_agent = build_search_agent()
        search_result = search_agent.invoke({
            "messages" : [("user", f"Find recent, reliable and detailed information about: {topic}")]
        })
        state["search_results"] = _extract_last_message_text(search_result)
    except Exception as e:
        state["search_results"] = f"Search step failed: {e}"

    print("\n search result ",state['search_results'])

    #step 2 - reader agent 
    print("\n"+" ="*50)
    print("step 2 - Reader agent is scraping top resources ...")
    print("="*50)

    try:
        reader_agent = build_reader_agent()
        reader_result = reader_agent.invoke({
            "messages": [("user",
                f"Based on the following search results about '{topic}', "
                f"pick the most relevant URL and scrape it for deeper content.\n\n"
                f"Search Results:\n{state['search_results'][:800]}"
            )]
        })

        state['scraped_content'] = _extract_last_message_text(reader_result)
    except Exception as e:
        state['scraped_content'] = f"Reader step failed: {e}"

    print("\nscraped content: \n", state['scraped_content'])

    #step 3 - writer chain 

    print("\n"+" ="*50)
    print("step 3 - Writer is drafting the report ...")
    print("="*50)

    research_combined = (
        f"SEARCH RESULTS : \n {state['search_results']} \n\n"
        f"DETAILED SCRAPED CONTENT : \n {state['scraped_content']}"
    )

    try:
        state["report"] = writer_chain.invoke({
            "topic" : topic,
            "research" : research_combined
        })
    except Exception as e:
        state["report"] = (
            f"Report generation failed: {e}\n\n"
            f"Topic: {topic}\n\n"
            f"Available search results:\n{state['search_results'][:2000]}\n\n"
            f"Available scraped content:\n{state['scraped_content'][:2000]}"
        )

    print("\n Final Report\n",state['report'])

    #critic report 

    print("\n"+" ="*50)
    print("step 4 - critic is reviewing the report ")
    print("="*50)

    try:
        state["feedback"] = critic_chain.invoke({
            "report":state['report']
        })
    except Exception as e:
        state["feedback"] = f"Critic step failed: {e}"

    print("\n critic report \n", state['feedback'])

    return state



if __name__ == "__main__":
    topic = input("\n Enter a research topic : ")
    run_research_pipeline(topic)
