import { z } from 'zod';

// Visitor log validation schema
export const visitorLogSchema = z.object({
  timestamp: z.string(),
  userAgent: z.string().max(500),
  referer: z.string().max(500),
  ip: z.string().max(100),
  country: z.string().max(100),
  city: z.string().max(100),
});

// Sanitize user input to prevent XSS
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .trim()
    .slice(0, 500); // Limit length
}

// Validate visitor data
export function validateVisitorData(data: any) {
  try {
    const validated = visitorLogSchema.parse(data);
    return {
      success: true,
      data: {
        ...validated,
        userAgent: sanitizeString(validated.userAgent),
        referer: sanitizeString(validated.referer),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error.issues : 'Validation failed',
    };
  }
}
