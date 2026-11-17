
import { useEffect, useState } from "react";
import { useRef } from "react";

import {
  addAudioFiles,
  getLibraryTracks,
  deleteAudioFile,
} from "./musicLibraryDB.js";

export default function MusicLibrary() {
  const [tracks, setTracks] = useState([]);
  const [status, setStatus] = useState("Loading library...");
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [showImportOptions, setShowImportOptions] = useState(false);



  async function refreshLibrary() {
    const savedTracks = await getLibraryTracks();
    setTracks(savedTracks);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadLibrary() {
      try {
        const savedTracks = await getLibraryTracks();

        if (!cancelled) {
          setTracks(savedTracks);
          setStatus("");
        }
      } catch (error) {
        console.error("Failed to load library:", error);

        if (!cancelled) {
          setStatus("Could not load your music library.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLibrary();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleImport(event) {
    const files = Array.from(event.target.files ?? []);

    // Allow users to select the same file again.
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const mp3Files = files.filter((file) =>
      file.name.toLowerCase().endsWith(".mp3")
    );

    if (mp3Files.length === 0) {
      setStatus("Please select MP3 files.");
      return;
    }

    try {
      const added = await addAudioFiles(mp3Files);
      await refreshLibrary();

      setStatus(
        `Added ${added} song(s) to your library.`
      );
    } catch (error) {
      console.error("Failed to import music:", error);
      setStatus(
        "Import failed. Check available browser storage."
      );
    }
  } 

  async function handleDelete(trackId) {
    try {
      await deleteAudioFile(trackId);
      await refreshLibrary();
      setStatus("Song removed.");
    } catch (error) {
      console.error("Failed to delete track:", error);
      setStatus("Could not remove this song.");
    }
  }

  return (
    <section className="music-library">
     <section className="music-library">
  <h2>My Music Library</h2>
  <h3>Upload music to play!</h3>

 <div className="import-section">
  <button
    type="button"
    onClick={() => setShowImportOptions(!showImportOptions)}
  >
    Import MP3s
  </button>

  {showImportOptions && (
    <div className="import-options">
      <button
        type="button"
        onClick={() => {
          fileInputRef.current?.click();
          setShowImportOptions(false);
        }}
      >
        Import Individual MP3s
      </button>

      <button
        type="button"
        onClick={() => {
          folderInputRef.current?.click();
          setShowImportOptions(false);
        }}
      >
        Import a Folder
      </button>
    </div>
  )}
</div>
{/* Individual MP3 files */}
<input
  ref={fileInputRef}
  type="file"
  accept=".mp3,audio/mpeg"
  multiple
  onChange={handleImport}
  hidden
/>

{/* Folder containing MP3 files */}
<input
  ref={folderInputRef}
  type="file"
  accept=".mp3,audio/mpeg"
  multiple
  webkitdirectory=""
  onChange={handleImport}
  hidden
/>
</section>

      <p role="status" aria-live="polite">
        {status}
      </p>

      {loading ? null : tracks.length === 0 ? (
        <p>Your library is empty. Import some songs to begin.</p>
      ) : (
        <ul>
          {tracks.map((track) => (
            <li key={track.id}>
              <span>{track.name}</span>{" "}
              <small>
                ({(track.size / (1024 * 1024)).toFixed(1)} MB)
              </small>{" "}
              <button
                type="button"
                onClick={() => handleDelete(track.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
