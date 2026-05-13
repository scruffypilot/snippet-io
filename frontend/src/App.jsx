import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [track, setTrack] = useState(null);
  const [audio, setAudio] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const [guessInput, setGuessInput] = useState("");
  const [guessCount, setGuessCount] = useState(1);
  const [hardMode, setHardMode] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const gameStarted = guessCount > 1;
  const guessText = guessCount === 1 ? "round" : "rounds";
  const normalDuration = 2 * guessCount - 1;
  const hardDuration = guessCount * 0.5;
  const snippetDuration = hardMode ? hardDuration : normalDuration;
  const gameOver = guessCount > 5;


  // code to run after page loads
  useEffect(() => {
    fetch("http://127.0.0.1:8000/track")
      .then(res => res.json())
      .then(data => {
        setTrack(data);

        const audioObj = new Audio(data.preview_url);

        audioObj.addEventListener("loadedmetadata", () => {
          const maxStart = Math.min(22, audioObj.duration - 1);
          const randomStart = Math.random() * maxStart;

          setStartTime(randomStart);
          setAudio(audioObj);
        });
      })
      .catch(err => console.error("Error fetching track:", err));
  }, []);

  function playSnippet() {
    if (!audio || startTime === null) return;

    const duration = snippetDuration;

    audio.currentTime = startTime;
    audio.play();

    setTimeout(() => {
      audio.pause();
    }, duration * 1000);
  }

  function handleGuess() {
    if (!track) return;

    const isCorrect = guessInput
      .toLowerCase()
      .includes(track.title.toLowerCase());

    if (isCorrect) {
      setRevealed(true);
    } else {
      alert("Try again!");
      setGuessCount(guessCount + 1);
    }
  }

  return (
  <div className="container">
    <h1>Snippet.io</h1>

    {!track ? (
      <p>Loading...</p>
    ) : gameOver && !revealed ? (
      <div className="win">
        <h2>Game Over!</h2>
        <p>The song was:</p>
        <p><strong>{track.title}</strong></p>
        <p>{track.artist}</p>
      </div>
    ) : (
      <div>
        {!revealed && <p>Guess the song!</p>}

        <h2>Round {guessCount} / 5</h2>

        {revealed && (
          <div>
            Congratulations! You have guessed the song in {guessCount} {guessText}!
            <p><strong>{track.title}</strong></p>
            <p>{track.artist}</p>
          </div>
        )}

        <div className="toggle-row">
  <label className="switch">
    <input
      type="checkbox"
      checked={hardMode}
      disabled={gameStarted}
      onChange={() => setHardMode(!hardMode)}
    />

    <span className="slider"></span>
  </label>

  <span>
    Hard Mode {hardMode ? "ON" : "OFF"}
  </span>
</div>


        <button onClick={playSnippet}>
          Play Snippet ({snippetDuration}s)
        </button>

        <div style={{ marginTop: 10 }}>
          <input
            type="text"
            placeholder="Enter your guess..."
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
          />

          <button onClick={handleGuess}>
            Submit Guess
          </button>
        </div>
      </div>
    )}
  </div>
);
}

export default App;