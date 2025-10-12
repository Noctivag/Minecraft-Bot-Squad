class FixedWindowRateLimiter {
  constructor({ maxPerWindow = 4, windowMs = 60 * 60 * 1000 } = {}) {
    this.maxPerWindow = maxPerWindow;
    this.windowMs = windowMs;
    this.windowStart = Date.now();
    this.count = 0;
  }
  resetWindowIfNeeded() {
    const now = Date.now();
    if (now - this.windowStart >= this.windowMs) {
      this.windowStart = now;
      this.count = 0;
    }
  }
  allow() {
    this.resetWindowIfNeeded();
    if (this.count < this.maxPerWindow) {
      this.count += 1;
      return true;
    }
    return false;
  }
  remaining() {
    this.resetWindowIfNeeded();
    return Math.max(0, this.maxPerWindow - this.count);
  }
  currentWindowEndsInMs() {
    const now = Date.now();
    const elapsed = now - this.windowStart;
    return Math.max(0, this.windowMs - elapsed);
  }
}
module.exports = { FixedWindowRateLimiter };