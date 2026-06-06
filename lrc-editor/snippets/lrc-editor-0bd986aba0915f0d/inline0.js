
const DB_NAME = "lrc-editor-audio-db";
const STORE_NAME = "audio-store";
const DB_VERSION = 1;

function getDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

export async function store_audio_file(name, file) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.put({ name, file }, "current");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function load_audio_file_js() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get("current");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const result = request.result;
            if (result) {
                resolve(result);
            } else {
                resolve(null);
            }
        };
    });
}

export async function clear_audio_file() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete("current");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}
