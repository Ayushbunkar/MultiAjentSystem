from langchain.agents import create_agent
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import web_search, web_scrape
import os
from dotenv import load_dotenv
load_dotenv()

llm = ChatMistralAI(
    api_key=os.getenv("MISTRAL_API_KEY"),
    model="mistral-small-latest",
    temperature=0.7,
)


def build_search_agent():
    agent = create_agent(
        model=llm,
        tools=[web_search, web_scrape],
        system_prompt=(
            "You are a web research agent. Use web_search first, then web_scrape when needed. "
            "Return concise and reliable findings with cited URLs."
        ),
    )
    return agent


def build_reader_agent():
    agent = create_agent(
        model=llm,
        tools=[web_scrape],
        system_prompt=(
            "You are a focused reader agent. Scrape the provided URL and summarize key facts clearly."
        ),
    )
    return agent


# writer chain

writer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that writes high-quality research reports."),
    ("human","""Write an article based on the following information.
    Topic: {topic}
    Research material:
    {research}

     Structure the report as 
        1. Introduction
        2. Key Finding (minimum 3 well-explained points)
        3. Conclusion
        4. Sources (list of urls used as sources)
    """),
])

writer_chain = writer_prompt | llm | StrOutputParser()

# critic_chain
critic_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a strict reviewer for research quality and factual clarity."),
    ("human","""Critique the following article based on the following information.
    Article: {report}
    Provide feedback on accuracy, completeness, structure, and clarity.
    Suggest specific improvements.
    """),
])
critic_chain = critic_prompt | llm | StrOutputParser()