from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_connection

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
    start_time: float # we prob want start time saved in backend for easier time retrieving in gamestate late
    hard_mode: bool

    # cumulative game stats 
    plays: int = 0
    wins: int = 0
    losses: int = 0
    total_guesses: int = 0


# object getting info from frontend on game creation
class StartGameRequest(BaseModel):
    hard_mode: bool

# object getting info from backend on game finish
class FinishGameRequest(BaseModel):
    game_id: str
    won: bool
    guesses: int


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
    connection = get_connection()

    connection.close()

    return {"message": "Database connection successful!"}


@app.get("/track", response_model=Track)
def get_track():
    return random.choice(TRACKS)

# POST request to backend to start game (eventually will properly implement)
@app.post("/start-game")
def start_game(request: StartGameRequest):
    game = GameState(
        game_id=str(uuid.uuid4()),
        track=random.choice(TRACKS),
        start_time=random.uniform(0, 22),
        hard_mode=request.hard_mode
    )
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
    """
    INSERT INTO games (
        game_id,
        title,
        artist,
        preview_url,
        start_time,
        hard_mode
    )
    VALUES (%s, %s, %s, %s, %s, %s)
    """,
    (
        game.game_id,
        game.track.title,
        game.track.artist,
        game.track.preview_url,
        game.start_time,
        game.hard_mode
    )
)
    connection.commit()
    cursor.close()
    connection.close()

    games[game.game_id] = game
    return game

# POST request so backend can update cumulative game stats
@app.post("/finish-game")
def finish_game(request: FinishGameRequest):
    print("FINISH GAME REQUEST:", request.model_dump())
    print("won =", request.won)
    print("type =", type(request.won))
    print("GAME ID:", request.game_id)

    game = games[request.game_id]
    game.plays += 1
    game.total_guesses += request.guesses

    connection = get_connection()
    cursor = connection.cursor()

    if request.won:
        game.wins +=1
        cursor.execute(
            """
            UPDATE games
            SET
                plays = plays + 1,
                wins = wins + 1,
                total_guesses = total_guesses + %s
            WHERE game_id = %s
            """,
        (request.guesses, request.game_id)
        )
    else:
        game.losses += 1
        cursor.execute(
            """
            UPDATE games
            SET
                plays = plays + 1,
                losses = losses + 1,
                total_guesses = total_guesses + %s
            WHERE game_id = %s
            """,
            (request.guesses, request.game_id)
        )
    connection.commit()
    cursor.close()
    connection.close()

    return game

@app.get("/db-test")
def test_game():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM games WHERE game_id = %s",
        ("test-game-123",)
    )

    game = cursor.fetchone()

    cursor.close()
    connection.close()

    return {"game": game}

# GET request to get game by game id for link sharing
@app.get("/game/{game_id}")
def get_game(game_id: str):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            game_id,
            title,
            artist,
            preview_url,
            start_time,
            hard_mode,
            plays,
            wins,
            losses,
            total_guesses
        FROM games
        WHERE game_id = %s
        """,
        (game_id,)
    )

    game = cursor.fetchone()

    cursor.close()
    connection.close()

    if game is None:
        raise HTTPException(
            status_code=404,
            detail="Game not found"
        )

    return {
        "game_id": game[0],
        "track": {
            "title": game[1],
            "artist": game[2],
            "preview_url": game[3]
        },
        "start_time": game[4],
        "hard_mode": game[5],
        "plays": game[6],
        "wins": game[7],
        "losses": game[8],
        "total_guesses": game[9]
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)