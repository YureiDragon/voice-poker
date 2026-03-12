export class Narrator {
  private synth: SpeechSynthesis | null;
  private rate: number;
  private queue: string[] = [];
  private speaking = false;

  constructor(rate = 1.0) {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.rate = rate;
  }

  setRate(rate: number): void {
    this.rate = rate;
  }

  async speak(text: string): Promise<void> {
    if (!this.synth) {
      console.log(`[Narrator]: ${text}`);
      return;
    }
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.rate;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      this.synth!.speak(utterance);
    });
  }

  async speakQueued(text: string): Promise<void> {
    this.queue.push(text);
    if (!this.speaking) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.speaking = true;
    while (this.queue.length > 0) {
      const text = this.queue.shift()!;
      await this.speak(text);
    }
    this.speaking = false;
  }

  stop(): void {
    this.queue = [];
    this.synth?.cancel();
    this.speaking = false;
  }
}
