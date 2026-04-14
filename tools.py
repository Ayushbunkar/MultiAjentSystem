from langchain_core.tools import tool 
import requests     
from  bs4 import BeautifulSoup
from tavily import TavilyClient
import os
from dotenv import load_dotenv
load_dotenv()

tavily=TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@tool
def web_search(query: str) -> str:
    """Search the web for the given query and return the results. returns titles ,urls and snippets of the search results."""
    response = tavily.search(query=query, max_results=5)
    results = response.get("results", []) if isinstance(response, dict) else []
    output = ""
    for result in results:
        title = result.get("title", "")
        url = result.get("url", "")
        snippet = result.get("content", result.get("snippet", ""))
        output += f"Title: {title}\nURL: {url}\nSnippet: {snippet}\n\n"
    if not output:
        return "No search results were returned."
    return output

@tool
def web_scrape(url: str) -> str:
    """Scrape the content of the given URL and return the text."""
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        for tag in soup(['script','nav','footer','style']):
            tag.decompose()
        return soup.get_text(separator=" ",strip=True)[:3000]
    except requests.RequestException as e:
        return f"An error occurred while fetching the URL: {e}"
    
    

 