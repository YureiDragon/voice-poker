export class Listener {
  private recognition: any | null = null;
  private listening = false;

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

  isListening(): boolean {
    return this.listening;
  }

  start(): Promise<string> {
    if (!this.recognition) {
      return Promise.reject(new Error('Speech recognition not supported'));
    }
    if (this.listening) {
      return Promise.reject(new Error('Already listening'));
    }
    this.listening = true;
    return new Promise((resolve, reject) => {
      let resolved = false;

      this.recognition.onresult = (event: any) => {
        resolved = true;
        this.listening = false;
        const text = event.results[0][0].transcript;
        resolve(text.trim());
      };
      this.recognition.onerror = (event: any) => {
        resolved = true;
        this.listening = false;
        reject(new Error(event.error));
      };
      this.recognition.onend = () => {
        this.listening = false;
        if (!resolved) {
          reject(new Error('no-speech'));
        }
      };

      try {
        this.recognition.start();
      } catch (e: any) {
        this.listening = false;
        reject(e);
      }
    });
  }

  stop(): void {
    if (this.listening) {
      this.recognition?.stop();
      this.listening = false;
    }
  }
}
