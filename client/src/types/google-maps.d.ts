/**
 * Google Maps type declarations
 * These supplement @types/google.maps for the Google Maps JavaScript API Loader
 */

declare module '@googlemaps/js-api-loader' {
  export class Loader {
    constructor(options: {
      apiKey: string;
      version?: string;
      libraries?: string[];
      language?: string;
      region?: string;
    });

    load(): Promise<typeof google>;
    loadCallback(callback: (err: Error | null) => void): void;
    deleteScript(): void;
    reset(): void;
    resetIfRetryingFailed(): void;
    loadPromise(): Promise<typeof google>;
  }
}
