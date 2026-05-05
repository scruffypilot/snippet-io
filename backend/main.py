from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

@app.get("/")
def home():
    return {"message": "the plup backend is running!"}

@app.get("/track")
def get_track():
    return {
        "title": "Test Song",
        "artist": "Test Artist",
        "preview_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)