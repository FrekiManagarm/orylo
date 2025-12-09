class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error("Circuit breaker is OPEN - service unavailable");
      }

      this.state = "HALF_OPEN";
    }

    try {
      const result = await fn();

      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = "OPEN";
        console.error(
          `🔴 Circuit breaker OPEN after ${this.failures} failures`,
        );
      }

      throw error;
    }
  }

  getState() {
    return this.state;
  }
}

export const aiCircuitBreaker = new CircuitBreaker();

export async function callAIWithCircuitBreaker<T>(
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await aiCircuitBreaker.execute(fn);
  } catch (error) {
    console.warn("⚠️ AI service unavailable, using fallback analysis");
    throw new Error("AI_SERVICE_UNAVAILABLE");
  }
}
