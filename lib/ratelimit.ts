import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// Rate limiter for visitor tracking - prevent spam
export const visitorRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(1, '5 s'), // 1 request per 5 seconds
  analytics: true,
  prefix: 'ratelimit:visitor',
});

// Rate limiter for general API calls
export const apiRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
  prefix: 'ratelimit:api',
});

// Helper to get client identifier (IP address)
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown';
  return ip;
}
