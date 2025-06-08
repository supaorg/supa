class PerfMeasure {
  private message: string;
  private startTime: number;
  private endTime: number = 0;

  constructor(message: string) {
    this.message = message;
    this.startTime = performance.now();
  }

  stop() {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    console.log('Performance /', this.message + ' /', duration.toFixed(2) + 'ms');
  }
}

export default function perf(message: string) {
  return new PerfMeasure(message);
}