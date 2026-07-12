export type RateLimitRecord = { count: number; timestamp: number };

const rateLimits = new Map<string, RateLimitRecord>();

// Clean up old records periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimits.entries()) {
    if (now - record.timestamp > 15 * 60 * 1000) { // 15 minutes
      rateLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

export function checkRateLimit(ip: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record) {
    rateLimits.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (now - record.timestamp > windowMs) {
    rateLimits.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count += 1;
  return true;
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown-ip';
}
