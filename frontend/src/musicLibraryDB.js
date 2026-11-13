
import { openDB } from "idb";

// Open (or create) the browser's local music database.
const dbPromise = openDB("snippet-io-library", 1, {
  upgrade(db) {
    db.createObjectStore("tracks", { keyPath: "id" });
  },
});

// Save imported audio files to IndexedDB.
export async function addAudioFiles(files) {
  const db = await dbPromise;
  const tx = db.transaction("tracks", "readwrite");

  let added = 0;

  try {
    for (const file of files) {
      // Only accept MP3 files.
      if (!file.name.toLowerCase().endsWith(".mp3")) {
        continue;
      }

      await tx.store.add({
        id: crypto.randomUUID(),
        name: file.name,
        audio: file,
        size: file.size,
        addedAt: Date.now(),
      });

      added++;
    }

    await tx.done;
    return added;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      // The transaction may already be finished.
    }

    throw error;
  }
}

// Retrieve the list of saved songs, without loading
// the actual audio files into the React component.
export async function getLibraryTracks() {
  const db = await dbPromise;
  const records = await db.getAll("tracks");

  return records.map(({ id, name, size, addedAt }) => ({
    id,
    name,
    size,
    addedAt,
  }));
}

// Retrieve an individual song's actual audio file.
export async function getAudioFile(trackId) {
  const db = await dbPromise;
  const track = await db.get("tracks", trackId);

  return track?.audio ?? null;
}

// Permanently delete a song from this local database.
export async function deleteAudioFile(trackId) {
  const db = await dbPromise;
  await db.delete("tracks", trackId);
}
