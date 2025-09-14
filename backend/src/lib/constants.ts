import { loadEnv } from '@medusajs/framework/utils'

import { assertValue } from 'utils/assert-value'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

/**
 * Is development environment
 */
export const IS_DEV = process.env.NODE_ENV === 'development'

/**
 * Public URL for the backend
 */
export const BACKEND_URL = process.env.BACKEND_PUBLIC_URL ?? process.env.RAILWAY_PUBLIC_DOMAIN_VALUE ?? 'http://localhost:9000'

/**
 * Database URL for Postgres instance used by the backend
 */
export const DATABASE_URL = assertValue(
  process.env.DATABASE_URL,
  'Environment variable for DATABASE_URL is not set',
)

/**
 * (optional) Redis URL for Redis instance used by the backend
 */
export const REDIS_URL = process.env.REDIS_URL;

/**
 * Admin CORS origins
 */
export const ADMIN_CORS = process.env.ADMIN_CORS || 'http://localhost:7000,http://localhost:7001';

/**
 * Auth CORS origins
 */
export const AUTH_CORS = process.env.AUTH_CORS || 'http://localhost:3000,https://falko-frontend.pages.dev,https://falko-56m.pages.dev';

/**
 * Store/frontend CORS origins
 */
export const STORE_CORS = process.env.STORE_CORS || 'http://localhost:3000,https://falko-frontend.pages.dev,https://falko-56m.pages.dev';

/**
 * JWT Secret used for signing JWT tokens
 */
export const JWT_SECRET = assertValue(
  process.env.JWT_SECRET,
  'Environment variable for JWT_SECRET is not set',
)

/**
 * Cookie secret used for signing cookies
 */
export const COOKIE_SECRET = assertValue(
  process.env.COOKIE_SECRET,
  'Environment variable for COOKIE_SECRET is not set',
)

/**
 * (optional) Minio configuration for file storage
 */
// File storage: using local provider for now (no external storage)

/**
 * (optional) Resend API Key and from Email - do not set if using SendGrid
 */
export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM;

/**
 * (optionl) SendGrid API Key and from Email - do not set if using Resend
 */
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
export const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_FROM;

/**
 * (optional) Stripe API key and webhook secret
 */
// Payments: Stripe disabled (we will add Paynow plugin later)

/**
 * (optional) Meilisearch configuration
 */
// Search: Meilisearch disabled

/**
 * Worker mode
 */
export const WORKER_MODE =
  (process.env.MEDUSA_WORKER_MODE as 'worker' | 'server' | 'shared' | undefined) ?? 'shared'

/**
 * Disable Admin
 */
export const SHOULD_DISABLE_ADMIN = process.env.MEDUSA_DISABLE_ADMIN === 'true'

/**
 * Loyalty (feature flag + config)
 */
export const LOYALTY_ENABLED = process.env.LOYALTY_POINTS_ENABLED === 'true'
export const LOYALTY_EARN_RATE = Number(process.env.LOYALTY_EARN_RATE || '0.01') // points per 1 unit currency
export const LOYALTY_REDEEM_RATE = Number(process.env.LOYALTY_REDEEM_RATE || '0.01') // currency value per point
export const LOYALTY_MIN_REDEEM = Number(process.env.LOYALTY_MIN_REDEEM || '100')
export const LOYALTY_MAX_ORDER_COVERAGE = Number(process.env.LOYALTY_MAX_ORDER_COVERAGE || '0.5')
export const LOYALTY_EXPIRATION_DAYS = Number(process.env.LOYALTY_EXPIRATION_DAYS || '0')
export const LOYALTY_AWARD_ON_STATUSES = (process.env.LOYALTY_AWARD_ON_STATUSES || 'completed').split(',').map(s => s.trim()).filter(Boolean)
