/**
 * offlineDB — IndexedDB wrapper for Dar Al-Uloom offline storage
 *
 * Stores:
 * - books:    book metadata (key = book.id)
 * - pdfs:     PDF ArrayBuffers (key = pdfUrl)
 * - images:   cover image blobs (key = imageUrl)
 * - favorites: local favorites (key = bookId)
 * - pending:  pending sync operations (key = opId)
 * - meta:     key-value metadata (lastSync, offlineEnabled, etc.)
 */

const DB_NAME = "dar_al_ulum_offline";
const DB_VERSION = 1;

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("books"))     db.createObjectStore("books",     { keyPath: "id" });
      if (!db.objectStoreNames.contains("pdfs"))      db.createObjectStore("pdfs",      { keyPath: "url" });
      if (!db.objectStoreNames.contains("images"))    db.createObjectStore("images",    { keyPath: "url" });
      if (!db.objectStoreNames.contains("favorites")) db.createObjectStore("favorites", { keyPath: "bookId" });
      if (!db.objectStoreNames.contains("pending"))   db.createObjectStore("pending",   { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("meta"))      db.createObjectStore("meta",      { keyPath: "key" });
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror   = (e) => reject(e.target.error);
  });
}

function tx(store, mode = "readonly") {
  return openDB().then(db => db.transaction(store, mode).objectStore(store));
}

function reqAsPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

// ─── Books ────────────────────────────────────────────────────────────────────
export async function cacheBooks(books) {
  const store = await tx("books", "readwrite");
  for (const book of books) {
    store.put({ ...book, _cached_at: Date.now() });
  }
  await reqAsPromise(store.transaction.done);
}

export async function getCachedBooks() {
  const store = await tx("books");
  return reqAsPromise(store.getAll());
}

export async function getCachedBook(id) {
  const store = await tx("books");
  return reqAsPromise(store.get(id));
}

// ─── PDFs ─────────────────────────────────────────────────────────────────────
export async function cachePdf(url, buffer, bookId, title) {
  const store = await tx("pdfs", "readwrite");
  store.put({ url, buffer, bookId, title, size: buffer.byteLength, date: Date.now() });
  await reqAsPromise(store.transaction.done);
}

export async function getCachedPdf(url) {
  const store = await tx("pdfs");
  return reqAsPromise(store.get(url));
}

export async function getAllCachedPdfs() {
  const store = await tx("pdfs");
  return reqAsPromise(store.getAll());
}

export async function deleteCachedPdf(url) {
  const store = await tx("pdfs", "readwrite");
  store.delete(url);
  await reqAsPromise(store.transaction.done);
}

// ─── Images ───────────────────────────────────────────────────────────────────
export async function cacheImage(url, blob) {
  if (!url || !blob) return;
  const store = await tx("images", "readwrite");
  store.put({ url, blob, size: blob.size, date: Date.now() });
  await reqAsPromise(store.transaction.done);
}

export async function getCachedImage(url) {
  if (!url) return null;
  const store = await tx("images");
  return reqAsPromise(store.get(url));
}

export async function getAllCachedImages() {
  const store = await tx("images");
  return reqAsPromise(store.getAll());
}

export async function getCachedImageBlobUrl(url) {
  const rec = await getCachedImage(url);
  return rec ? URL.createObjectURL(rec.blob) : null;
}

// ─── Favorites (offline) ──────────────────────────────────────────────────────
export async function saveLocalFavorite(bookId, userEmail) {
  const store = await tx("favorites", "readwrite");
  store.put({ bookId, userEmail, date: Date.now() });
  await reqAsPromise(store.transaction.done);
}

export async function removeLocalFavorite(bookId) {
  const store = await tx("favorites", "readwrite");
  store.delete(bookId);
  await reqAsPromise(store.transaction.done);
}

export async function getLocalFavorites() {
  const store = await tx("favorites");
  return reqAsPromise(store.getAll());
}

export async function getLocalFavoriteIds() {
  const favs = await getLocalFavorites();
  return favs.map(f => f.bookId);
}

// ─── Pending sync queue ───────────────────────────────────────────────────────
export async function addPendingOp(op) {
  const store = await tx("pending", "readwrite");
  store.put({ ...op, date: Date.now() });
  await reqAsPromise(store.transaction.done);
}

export async function getPendingOps() {
  const store = await tx("pending");
  return reqAsPromise(store.getAll());
}

export async function deletePendingOp(id) {
  const store = await tx("pending", "readwrite");
  store.delete(id);
  await reqAsPromise(store.transaction.done);
}

// ─── Meta ─────────────────────────────────────────────────────────────────────
export async function getMeta(key) {
  const store = await tx("meta");
  const rec = await reqAsPromise(store.get(key));
  return rec ? rec.value : null;
}

export async function setMeta(key, value) {
  const store = await tx("meta", "readwrite");
  store.put({ key, value });
  await reqAsPromise(store.transaction.done);
}

// ─── Storage management ───────────────────────────────────────────────────────
export async function clearAllCache() {
  const stores = ["books", "pdfs", "images", "pending"];
  for (const s of stores) {
    const store = await tx(s, "readwrite");
    store.clear();
    await reqAsPromise(store.transaction.done);
  }
}

export async function getStorageEstimate() {
  let booksCount = 0, pdfsCount = 0, imagesCount = 0, pdfsSize = 0, imagesSize = 0;

  const books = await getCachedBooks();
  booksCount = books.length;

  const pdfs = await getAllCachedPdfs();
  pdfsCount = pdfs.length;
  pdfsSize = pdfs.reduce((sum, p) => sum + (p.size || 0), 0);

  const images = await getAllCachedImages();
  imagesCount = images.length;
  imagesSize = images.reduce((sum, i) => sum + (i.size || 0), 0);

  const totalSize = pdfsSize + imagesSize;
  const navEstimate = navigator.storage?.estimate ? await navigator.storage.estimate() : {};

  return {
    booksCount,
    pdfsCount,
    imagesCount,
    pdfsSize,
    imagesSize,
    totalSize,
    quota: navEstimate.quota || 0,
    usage: navEstimate.usage || 0,
  };
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}