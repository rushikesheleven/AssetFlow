from fastapi import FastAPI
from routers import assets

app = FastAPI(
    title="AssetFlow API",
    description="Enterprise Asset & Resource Management System",
    version="1.0.0"
)

# Registering the router you just built[span_7](start_span)[span_7](end_span)
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])

@app.get("/api/health")
def health_check():
    return {"status": "AssetFlow Backend is running locally."}