from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import Response
from pydantic import BaseModel
from dotenv import load_dotenv
import asyncio
import traceback
from pipeline import run_research_pipeline

load_dotenv()

app = FastAPI(title="Multi-Agent Research System")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

class ResearchRequest(BaseModel):
    topic: str

class ResearchResponse(BaseModel):
    status: str
    search_results: str
    scraped_content: str
    report: str
    feedback: str

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)

@app.post("/api/research")
async def research(request: ResearchRequest):
    """Run the research pipeline for a given topic"""
    try:
        if not request.topic or len(request.topic.strip()) == 0:
            raise HTTPException(status_code=400, detail="Topic cannot be empty")
        
        # Run the pipeline
        result = await asyncio.to_thread(run_research_pipeline, request.topic)
        
        return ResearchResponse(
            status="success",
            search_results=result.get("search_results", ""),
            scraped_content=result.get("scraped_content", ""),
            report=result.get("report", ""),
            feedback=result.get("feedback", "")
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Research pipeline failed: {e}")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Multi-Agent Research System is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
