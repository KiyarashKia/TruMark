declare module "quagga" {
    interface QuaggaConfig {
      inputStream: {
        name: string;
        type: string;
        target: HTMLElement | string;
        constraints: {
          width: number;
          height: number;
          facingMode: string;
        };
      };
      decoder: {
        readers: string[];
      };
    }
  
    interface QuaggaResult {
      codeResult: {
        code: string;
      };
    }
  
    interface QuaggaError {
      name: string;
      message: string;
    }
  
    function init(config: QuaggaConfig, callback: (err: QuaggaError | null) => void): void;
    function start(): void;
    function stop(): void;
    function onDetected(callback: (data: QuaggaResult) => void): void;
    function decodeSingle(config: QuaggaConfig, callback: (result: QuaggaResult | null) => void): void;
  }