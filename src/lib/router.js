// src/lib/router.js
// Router berbasis hash (#/...) untuk navigasi MODULAB tanpa butuh rewrite server.

const listeners = new Set();

export function getHashPath() {
  const raw = window.location.hash || '#/';
  // Bersihkan parameter query atau token jika ada
  const [path] = raw.split('?');
  return path || '#/';
}

export function getQueryParams() {
  const raw = window.location.hash || '';
  const parts = raw.split('?');
  if (parts.length < 2) return new URLSearchParams();
  return new URLSearchParams(parts[1]);
}

export function navigate(path) {
  if (window.location.hash !== path) {
    window.location.hash = path;
  } else {
    // Jika hash sama persis, pemicu manual untuk listener
    notifyListeners();
  }
}

function notifyListeners() {
  const currentPath = getHashPath();
  const query = getQueryParams();
  listeners.forEach((callback) => {
    try {
      callback(currentPath, query);
    } catch (err) {
      console.error('Error on route listener:', err);
    }
  });
}

// Inisialisasi listener hashchange global
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    notifyListeners();
  });
}

export function onRoute(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

