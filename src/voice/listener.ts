export class Listener {
  private recognition: any | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  start(): Promise<string> {
    if (!this.recognition) {
      return Promise.reject(new Error('Speech recognition not supported'));
    }
    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        resolve(text.trim());
      };
      this.recognition.onerror = (event: any) => {
        reject(new Error(event.error));
      };
      this.recognition.onend = () => {};
      this.recognition.start();
    });
  }

  stop(): void {
    this.recognition?.stop();
  }
}
