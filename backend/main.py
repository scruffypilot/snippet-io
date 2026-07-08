from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import random
import uuid

app = FastAPI()
games = {}


# generic track model class
class Track(BaseModel):
    title: str
    artist: str
    preview_url: str

# for shareable link purposes later
class GameState(BaseModel):
    game_id: str
    track: Track
    start_time: float # we prob want start time saved in backend for easier time retrieving in gamestate later

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

# POST request to backend to start game (eventually will properly implement)
@app.post("/start-game")
def start_game():
    game = GameState(
        game_id=str(uuid.uuid4()),
        track=random.choice(TRACKS),
        start_time=random.uniform(0, 22)
    )
    games[game.game_id] = game
    return game

# GET request to get game by game id for link sharing
@app.get("/game/{game_id}", response_model=GameState)
def get_game(game_id: str):
    if game_id not in games:
        raise HTTPException(
            status_code=404,
            detail="Game not found"
        )
    return games[game_id]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)