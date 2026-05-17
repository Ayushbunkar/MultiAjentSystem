# Multi-Agent Research System with Web Interface

A sophisticated multi-agent research system that combines search, scraping, writing, and criticism capabilities with a modern web interface built with FastAPI, HTML, and CSS.

## Features

- **Search Agent**: Searches the web for relevant information
- **Reader Agent**: Scrapes and extracts detailed content from URLs
- **Writer Chain**: Generates comprehensive AI-powered reports
- **Critic Chain**: Reviews and critiques the generated reports
- **Web Interface**: Beautiful, responsive UI for easy interaction
- **Export Reports**: Download research reports as text files

## Prerequisites

- Python 3.9+
- FastAPI and Uvicorn
- LangChain ecosystem
- API Keys:
  - `MISTRAL_API_KEY` - For LLM
  - `TAVILY_API_KEY` - For web search
  - `OPENAI_API_KEY` - (optional)

## Installation & Setup

### 1. Install Dependencies

```bash
# Using uv (recommended)
uv pip install -r requirements.txt

# Or using pip
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
MISTRAL_API_KEY=your_mistral_api_key
TAVILY_API_KEY=your_tavily_api_key
OPENAI_API_KEY=your_openai_api_key (optional)
```

## Running the Application

### Start the FastAPI Server

```bash
python app.py
```

Or using uvicorn directly:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Access the Web Interface

Open your browser and navigate to:
```
http://localhost:8000
```

## Project Structure

```
MultiAjentSystem/
├── app.py                 # FastAPI application
├── pipeline.py            # Research pipeline logic
├── agents.py              # AI agent definitions
├── tools.py               # Search and scraping tools
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (create this)
└── static/
    ├── index.html         # Web interface
    ├── style.css          # Styling
    └── script.js          # Frontend interactivity
```

## Usage

1. Enter a research topic in the search box
2. Click "Start Research" button
3. Watch as the system:
   - Searches for information
   - Scrapes relevant content
   - Generates a comprehensive report
   - Reviews and critiques the report
4. Download the full report or start a new research

## API Endpoints

### Health Check
```
GET /api/health
```

### Start Research
```
POST /api/research
Content-Type: application/json

{
    "topic": "Your research topic here"
}
```

Response:
```json
{
    "status": "success",
    "search_results": "...",
    "scraped_content": "...",
    "report": "...",
    "feedback": "..."
}
```

## Frontend Features

- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Status**: Shows processing status for each step
- **Error Handling**: User-friendly error messages
- **Export Functionality**: Download reports as text files
- **Beautiful UI**: Gradient backgrounds and smooth animations

## Customization

### Change Server Port
Edit `app.py`:
```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=YOUR_PORT)
```

### Modify Report Format
Edit `static/script.js` in the `downloadReport()` function

### Change UI Theme
Edit color variables in `static/style.css`:
```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    /* ... more colors ... */
}
```

## Example Research Topics

- "Latest AI trends in 2024"
- "Climate change impacts on global economy"
- "Machine learning applications in healthcare"
- "Future of renewable energy"
- "Cryptocurrency regulations worldwide"

## Troubleshooting

### "Module not found" errors
```bash
# Reinstall dependencies
uv pip install --force-reinstall -r requirements.txt
```

### Server won't start
- Check if port 8000 is available
- Ensure all API keys are set in `.env`
- Check Python version (3.9+ required)

### API calls failing
- Verify API keys in `.env`
- Check internet connection
- Ensure Tavily/Mistral services are accessible

## Dependencies Overview

- **FastAPI**: Web framework
- **Uvicorn**: ASGI server
- **LangChain**: AI agent framework
- **Tavily**: Web search API
- **BeautifulSoup4**: Web scraping
- **Pydantic**: Data validation

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Feel free to submit issues and enhancement requests.

## Tips

- Keep research topics specific for better results
- Reports are usually generated within 30-60 seconds
- Downloaded reports contain all four steps of the research pipeline
- Check browser console for debugging information

---

**Happy Researching!**
