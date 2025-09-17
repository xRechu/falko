import { MedusaRequest, MedusaResponse, MedusaNextFunction } from '@medusajs/framework';

/**
 * CORS middleware for enhanced cookie support
 * Ensures cookies are properly handled across domains
 */
export function corsMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): void {
  // Get origin from request
  const origin = req.headers.origin as string;
  
  // Allowed origins for CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'https://falko-frontend.pages.dev',
    'https://falko-56m.pages.dev',
    'https://falkoproject.com',
    'https://www.falkoproject.com'
  ];
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Essential headers for cookie authentication
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, x-publishable-api-key');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}