import { useEffect, useState } from "react";

function App() {
  const [track, setTrack] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/track")
      .then((res) => res.json())
      .then((data) => setTrack(data))
      .catch((err) => console.error("Error fetching track:", err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Snippet.io</h1>

      {track ? (
        <div>
          <p><strong>{track.title}</strong></p>
          <p>{track.artist}</p>
        </div>
      ) : (
        <p>the plup</p>
      )}
    </div>
  );
}

export default App;