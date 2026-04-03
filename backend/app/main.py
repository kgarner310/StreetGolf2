from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.routers import holes, votes


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database import init_db
    init_db()
    yield


app = FastAPI(title="StreetGolf API", lifespan=lifespan)

app.include_router(holes.router)
app.include_router(votes.router)


@app.get("/v1/health")
def health():
    return {"status": "ok"}
