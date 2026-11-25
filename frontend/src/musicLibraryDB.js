
import { openDB } from "idb";
import jsmediatags from "jsmediatags";

// Create or open the local IndexedDB database.
const dbPromise = openDB("snippet-io-library", 1, {
  upgrade(db) {
    db.createObjectStore("tracks", { keyPath: "id" });
  },
});

// Read metadata embedded inside an MP3 file.
function readAudioMetadata(file) {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: (result) => {
        const tags = result.tags;

        resolve({
          // These values come from the MP3's embedded metadata.
          title:
            typeof tags.title === "string" && tags.title.trim()
              ? tags.title.trim()
              : "Unknown Title",

          artist:
            typeof tags.artist === "string" && tags.artist.trim()
              ? tags.artist.trim()
              : "Unknown Artist",

          album:
            typeof tags.album === "string"
              ? tags.album.trim()
              : "",

          track:
            typeof tags.track === "string"
              ? tags.track.trim()
              : "",
        });
      },

      onError: (error) => {
        console.warn(
          `Could not read metadata for ${file.name}:`,
          error
        );

        // Keep the file importable even if its metadata
        // is missing or cannot be read.
        resolve({
          title: "Unknown Title",
          artist: "Unknown Artist",
          album: "",
          track: "",
        });
      },
    });
  });
}

// Import MP3 files and save their audio and metadata.
export async function addAudioFiles(files) {
  const mp3Files = Array.from(files).filter((file) =>
    file.name.toLowerCase().endsWith(".mp3")
  );

  const tracksToAdd = [];

  // Read metadata before opening the database transaction.
  for (const file of mp3Files) {
    const metadata = await readAudioMetadata(file);

    tracksToAdd.push({
      id: crypto.randomUUID(),
      name: file.name,
      audio: file,
      size: file.size,
      addedAt: Date.now(),

      // Store the extracted metadata with the audio file.
      ...metadata,
    });
  }

  const db = await dbPromise;
  const tx = db.transaction("tracks", "readwrite");

  try {
    for (const track of tracksToAdd) {
      await tx.store.add(track);
    }

    await tx.done;

    return tracksToAdd.length;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      // The transaction may already have finished or aborted.
    }

    throw error;
  }
}

// Retrieve the library's metadata without loading all audio files.
export async function getLibraryTracks() {
  const db = await dbPromise;
  const records = await db.getAll("tracks");

  return records.map(
    ({ id, name, size, addedAt, title, artist, album, track }) => ({
      id,
      name,
      size,
      addedAt,
      title,
      artist,
      album,
      track,
    })
  );
}

// Retrieve the actual audio file when gameplay needs it.
export async function getAudioFile(trackId) {
  const db = await dbPromise;
  const track = await db.get("tracks", trackId);

  return track?.audio ?? null;
}

// Delete one song from the local library.
export async function deleteAudioFile(trackId) {
  const db = await dbPromise;
  await db.delete("tracks", trackId);
}
