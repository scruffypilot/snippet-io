import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [track, setTrack] = useState(null);
  const [audio, setAudio] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const [guessInput, setGuessInput] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [dispGuesses, setDispGuesses] = useState([]); // for display on site itself
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

    const normalizedGuess = guessInput
    .toLowerCase()
    .trim();

    const alreadyGuessed = guesses.includes(normalizedGuess)

    if (alreadyGuessed) {
      alert(`You already guessed "${guessInput.trim()}"!`);      
      return;

    }
    const isCorrect = normalizedGuess
      .includes(track.title.toLowerCase());
  
    if (isCorrect) {
      setRevealed(true);
      setGuessInput("");
    } else {
      if (guessCount < 5) {
        alert("Try again!");
        setGuesses([...guesses, normalizedGuess])
        setDispGuesses([...dispGuesses, guessInput.trim()])
        setGuessInput("");
      }
      setGuessCount(guessCount + 1);
    }
  }

  function resetGame() {
  setGuessInput("");
  setGuesses([]);
  setDispGuesses([]);
  setGuessCount(1);
  setRevealed(false);

  // set new random start time
  const maxStart = Math.min(22, audio.duration - 1);
  const randomStart = Math.random() * maxStart;

setStartTime(randomStart);
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
        <button onClick={resetGame}>
          Play Again
          </button>
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
            <button onClick={resetGame}>
              Play Again
              </button>
          </div>
        )}

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

{!revealed && (
        <button onClick={playSnippet}>
          Play Snippet ({snippetDuration}s)
        </button>
)}

        {dispGuesses.map((guess, index) => (
  <input
    key={index}
    type="text"
    value={guess}
    disabled
  />
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