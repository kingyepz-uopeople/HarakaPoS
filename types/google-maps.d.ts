// TypeScript definitions for Google Maps JavaScript API
// This allows TypeScript to recognize the google.maps namespace

declare global {
  interface Window {
    google: typeof google;
  }
}

export {};
