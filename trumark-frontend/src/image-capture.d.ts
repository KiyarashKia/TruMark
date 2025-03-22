declare module 'image-capture' {
    export default class ImageCapture {
      constructor(videoTrack: MediaStreamTrack);
      getPhotoCapabilities(): Promise<{
        torch: boolean;
        [key: string]: boolean | number | string;
      }>;
    }
  }