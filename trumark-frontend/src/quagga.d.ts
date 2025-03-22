declare module "quagga" {
  interface TorchConstraint extends MediaTrackConstraintSet {
    torch?: boolean;
  }

  interface ExtendedMediaTrackConstraints extends MediaTrackConstraints {
    advanced?: TorchConstraint[];
  }

  export interface QuaggaConfig {
    inputStream: {
      name?: string;
      type?: string;
      target?: HTMLElement | string;
      constraints?: {
        width?: number | { ideal?: number };
        height?: number | { ideal?: number };
        facingMode?: string;
        advanced?: TorchConstraint[];
      };
      size?: number;
      singleChannel?: boolean;
      src?: string;
    };
    decoder: {
      readers: Array<
        | "code_128_reader"
        | "ean_reader"
        | "ean_8_reader"
        | "code_39_reader"
        | "code_39_vin_reader"
        | "upc_reader"
        | "upc_e_reader"
        | "codabar_reader"
        | "i2of5_reader"
      >;
      multiple?: boolean;
    };
    locate?: boolean;
    frequency?: number;
    numOfWorkers?: number;
    halfSample?: boolean;
    patchSize?: "x-small" | "small" | "medium" | "large";
  }

  export interface QuaggaResult {
    codeResult: {
      code: string;
      format?: string;
      start?: number;
      end?: number;
      codeset?: string;
      startInfo?: {
        error?: number;
        code?: number;
        start?: number;
        end?: number;
      };
      decodedCodes?: Array<{
        code?: number;
        start?: number;
        end?: number;
      }>;
      direction?: number;
    };
    line?: [
      { x: number; y: number },
      { x: number; y: number }
    ];
    angle?: number;
    pattern?: number[];
    box?: [
      { x: number; y: number },
      { x: number; y: number },
      { x: number; y: number },
      { x: number; y: number }
    ];
  }

  export interface QuaggaError {
    name: string;
    message: string;
    stack?: string;
  }

  export function init(
    config: QuaggaConfig,
    callback?: (err: QuaggaError | null) => void
  ): void;

  export function start(): void;
  export function stop(): void;
  export function pause(): void;
  export function onDetected(callback: (result: QuaggaResult) => void): void;
  export function offDetected(callback?: (result: QuaggaResult) => void): void;
  export function decodeSingle(
    config: QuaggaConfig,
    callback: (result: QuaggaResult | null) => void
  ): void;
}
