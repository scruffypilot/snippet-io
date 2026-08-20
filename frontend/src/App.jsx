import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [track, setTrack] = useState(null);
  const [audio, setAudio] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [gameStats, setGameStats] = useState(null);

  const [guessInput, setGuessInput] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [dispGuesses, setDispGuesses] = useState([]); // for display on site itself
  const [guessCount, setGuessCount] = useState(1);
  const [hardMode, setHardMode] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [urlError, setUrlError] = useState("");


  const gameStarted = guessCount > 1;
  const guessText = guessCount === 1 ? "round" : "rounds";
  const normalDuration = 2 * guessCount - 1;
  const hardDuration = guessCount * 0.5;
  const snippetDuration = hardMode ? hardDuration : normalDuration; // use hardDuration if hardMode
  const gameOver = guessCount > 5;


  const shareString = `Snippet.io ${guessCount}/5\n` +
    guesses.map(g => (g.correct ? "✅" : "❌")).join("") +
    "\n\nI played Snippet.io!";
  const [playlistUrl, setPlaylistUrl] = useState(
    localStorage.getItem("playlistUrl") || ""
  ); 
  const [streak, setStreak] = useState(() => {
    return Number(localStorage.getItem("streak")) || 0;
  });

  function startGame() {
  fetch("http://127.0.0.1:8000/start-game", {
    method: "POST",
      headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    hard_mode: hardMode,
  }),
  })
    .then(res => res.json())
    .then(data => {
      setTrack(data.track);
      setGameId(data.game_id);
      setHardMode(data.hard_mode);
      

      const audioObj = new Audio(data.track.preview_url);

      audioObj.addEventListener("loadedmetadata", () => {
        setStartTime(data.start_time);
        setAudio(audioObj);
      });
    })
    .catch(err => console.error("Error fetching track:", err));
}

/* load game from link with gameID */
function loadGame(gameId) {
  fetch(`http://127.0.0.1:8000/game/${gameId}`)
    .then(res => res.json())
    .then(data => {
      setTrack(data.track);
      setGameId(data.game_id);
      setHardMode(data.hard_mode);
      
      const audioObj = new Audio(data.track.preview_url);

      audioObj.addEventListener("loadedmetadata", () => {
        setStartTime(data.start_time);
        setAudio(audioObj);
    });
})
    .catch(err => console.error("Error fetching track:", err));
}

  // load game from shared url link if one is detected
  useEffect(() => {
    const path = window.location.pathname;
    
    if (path.startsWith("/game/")) {
      const urlGameId = path.split("/game/")[1];
      loadGame(urlGameId);
  }
    
  }, []);

  // checking for game over condition
  useEffect(() => {
    if (gameOver) { // if player loses
      setStreak(0);
      recordGameStats(false);
    }
  }, [gameOver]);

  // dynamically updating streak value
  useEffect(() => {
    localStorage.setItem("streak", streak);
  }, [streak]);

  function playSnippet() {
    if (!audio || startTime === null) return;

    const duration = snippetDuration;

    audio.currentTime = startTime;
    setIsPlaying(true);
    audio.play();

    setTimeout(() => {
      audio.pause();
      setIsPlaying(false);
    }, duration * 1000);
  }

  function isValidSpotifyUrl(url) {
    return (
      url.startsWith("https://open.spotify.com/playlist/") ||
      url.startsWith("https://open.spotify.com/album/")
    );
  }

  function handleUrlInput(url) {
    localStorage.setItem("playlistUrl", url);
    if (!isValidSpotifyUrl(url)) { // if not a valid Spotify url
      setUrlError("Please enter a valid Spotify playlist or album URL.");
      return;
    }
    setUrlError("");
    setSetupComplete(true);
    startGame();
  }

  function handleGuess() {
    if (!track) return;
    const normalizedGuess = guessInput
      .toLowerCase()
      .trim();


    const alreadyGuessed = guesses.some(
      (g) => g.text === normalizedGuess
    );

    if (alreadyGuessed) {
      alert(`You already guessed "${guessInput.trim()}"!`);
      return;

    }
    const isCorrect = normalizedGuess
      .includes(track.title.toLowerCase());

    if (isCorrect) {
      setStreak(streak + 1);
      setRevealed(true);
      setGuesses([...guesses, {
        text: normalizedGuess,
        correct: true
      }])
      recordGameStats(true);
      setGuessInput("");
    } else {
      if (guessCount < 5) {
        setGuesses([...guesses, {
          text: normalizedGuess,
          correct: false
        }])
        setDispGuesses([...dispGuesses, guessInput.trim()])
        setGuessInput("");
      }
      setGuessCount(guessCount + 1);
    }
  }

  function recordGameStats(won) {
  consosle.log(won)
  fetch("http://127.0.0.1:8000/finish-game", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    game_id: gameId,
    won: won,
    guesses: guessCount,
  }),
})
  .then(res => res.json())
  .then(data => {
    setGameStats(data)
  });

  }


  function resetGame() {
    setGuessInput("");
    setGuesses([]);
    setDispGuesses([]);
    setGuessCount(1);
    setRevealed(false);

    // set new random start time
    //const maxStart = Math.min(22, audio.duration - 1);
    //const randomStart = Math.random() * maxStart;

    startGame();

  }

  // for copying results after game win
  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareString);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  async function copyGameLink() {
  const shareUrl = `${window.location.origin}/game/${gameId}`;
  await navigator.clipboard.writeText(shareUrl);
}


  return (
    <div className="container">
      <h1>Snippet.io</h1>

      {!track ? (
        <div>
          <p>Paste a Spotify playlist URL</p>

          <input
            type="text"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUrlInput(playlistUrl);
              }
            }}
          />

          {urlError && (
            <p className="error">{urlError}</p>
          )}
          <button
            onClick={() => handleUrlInput(playlistUrl)}
          >
            Start Game
          </button>
          <div className="toggle-row">
            {!revealed && (
              <label className="switch">
                <input
                  type="checkbox"
                  checked={hardMode}
                  disabled={gameStarted}
                  onChange={() => setHardMode(!hardMode)}
                />

                <span className="slider"></span>
              </label>
            )}
            {!revealed && (
              <span>
                Hard Mode {hardMode ? "ON" : "OFF"}
              </span>
              
            )}
          </div>
          <p className = "hint">Games with hard mode enabled reveal much less of the song with each guess.</p>
        </div>
        
        

      ) : gameOver && !revealed ? (
        <div className="win-buttons">
          <h2>Game Over!</h2>
          <p>The song was:</p>
          <p><strong>{track.title}</strong></p>
          <p>{track.artist}</p>
          <button onClick={resetGame}>
            Play Again
          </button>
                    <button onClick={copyGameLink}>
    Share This Game
</button>
{gameStats && (
  <div>
    <p>Played {gameStats.plays} times</p>
    <p>Wins: {gameStats.wins}</p>
    <p>Losses: {gameStats.losses}</p>
    <p>
      Win Rate: {((gameStats.wins / gameStats.plays) * 100).toFixed(1)}%
    </p>
  </div>
)}
        </div>
      ) : (
        <div>
          {!revealed && <p>Guess the song!</p>}

          <h2>Round {guessCount} / 5</h2>
          <p>🔥 Streak: {streak}</p>
          <p>Hard Mode: {hardMode ? "ON" : "OFF"}</p>

          {revealed && (
            <div>
              Congratulations! You have guessed the song in {guessCount} {guessText}!
              <p><strong>{track.title}</strong></p>
              <p>{track.artist}</p>

              <div className="win-buttons">
                <button onClick={resetGame}>
                  Play Again
                </button>
                <button onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy Results"}
                </button>
                <button onClick={copyGameLink}>
    Share This Game
</button>
{gameStats && (
  <div>
    <p>Played {gameStats.plays} times</p>
    <p>Wins: {gameStats.wins}</p>
    <p>Losses: {gameStats.losses}</p>
    <p>
      Win Rate: {((gameStats.wins / gameStats.plays) * 100).toFixed(1)}%
    </p>
  </div>
)}
              </div>
            </div>
          )}


          {!revealed && (
            <button onClick={playSnippet} disabled={isPlaying}>
              {isPlaying
                ? "Playing..."
                : `Play Snippet (${snippetDuration}s)`}
            </button>
          )}

          {/* dynamically creates disabled textboxes showing incorrect guesses */}
          {guesses.map((guess, index) => (
            <div className="guess-row" key={index}>
              <input
                type="text"
                value={guess.text}
                disabled
              />
              <span className="guess-icon">
                {guess.correct ? "✅" : "❌"}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            {!revealed && (
              <input
                type="text"
                placeholder="Enter your guess..."
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                autoFocus

                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleGuess();
                  }
                }}
              />
            )}
            {!revealed && (
              <button onClick={handleGuess}>
                Submit Guess
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

}
export default App;