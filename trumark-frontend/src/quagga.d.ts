declare module "quagga" {
  export interface QuaggaConfig {
    inputStream: {
      name?: string;
      type?: string;
      target?: HTMLElement | string;
      constraints?: {
        width?: number | { ideal?: number };
        height?: number | { ideal?: number };
        facingMode?: string;
      };
      size?: number;
      singleChannel?: boolean;
      src?: string;
    };
    decoder: {
      readers: string[];
      multiple?: boolean; // Set to true if you want to detect multiple barcodes
    };
    // Performance and accuracy options:
    locate?: boolean;
    frequency?: number;
    numOfWorkers?: number;
    halfSample?: boolean;
    patchSize?: "x-small" | "small" | "medium" | "large";
  }

  export interface QuaggaResult {
    codeResult: {
      code: string;
    };
  }

  export interface QuaggaError {
    name: string;
    message: string;
  }

  export function init(
    config: QuaggaConfig,
    callback: (err: QuaggaError | null) => void
  ): void;
  export function start(): void;
  export function stop(): void;
  export function onDetected(
    callback: (data: QuaggaResult) => void
  ): void;
  export function offDetected(
    callback?: (data: QuaggaResult) => void
  ): void;
  export function decodeSingle(
    config: QuaggaConfig,
    callback: (result: QuaggaResult | null) => void
  ): void;
}