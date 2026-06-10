from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import random

app = FastAPI()


# generic track model class
class Track(BaseModel):
    title: str
    artist: str
    preview_url: str


# to be generated with data scraped from a user's Spotify account or playlist later
TRACKS = [
    Track(
        title="Test Song 1",
        artist="Test Artist 1",
        preview_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    ),
    Track(
        title="Test Song 2",
        artist="Test Artist 2",
        preview_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    ),
    Track(
        title="Test Song 3",
        artist="Test Artist 3",
        preview_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    )
]


@app.get("/")
def home():
    return {"message": "the plup backend is running!"}


@app.get("/track", response_model=Track)
def get_track():
    return random.choice(TRACKS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)