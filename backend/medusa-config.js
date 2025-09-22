import { loadEnv, Modules, defineConfig } from '@medusajs/utils';
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  WORKER_MODE,
} from 'lib/constants';

loadEnv(process.env.NODE_ENV, process.cwd());

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET
    },
    build: {
      rollupOptions: {
        external: ["@medusajs/dashboard"]
      }
    }
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    {
      key: Modules.AUTH,
      resolve: '@medusajs/auth',
      options: {
        providers: [
          {
            id: 'emailpass',
            resolve: '@medusajs/auth-emailpass',
            resources: ['customer'],
            is_default: true,
            options: {
              cookie: {
                sameSite: 'none',
                secure: true,
                domain: '.falkoprojects.com'
              }
            }
          }
        ]
      }
    },
    {
      key: Modules.FILE,
      resolve: '@medusajs/file',
      options: {
        providers: [
          {
            resolve: '@medusajs/file-s3',
            id: 'r2',
            options: {
              endpoint: process.env.R2_ENDPOINT,
              region: process.env.R2_REGION || 'auto',
              bucket: process.env.R2_BUCKET,
              access_key_id: process.env.R2_ACCESS_KEY_ID,
            secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
              forcePathStyle: true,
              s3ForcePathStyle: true,
              baseUrl: process.env.R2_PUBLIC_BASE_URL,
              // opcjonalnie: możesz wystawić publiczne URL jeśli masz publiczny domen/CDN
              // jeśli nie ustawisz baseUrl – provider zwróci domyślny endpoint + bucket + key
            }
          }
        ]
      }
    },
    ...(REDIS_URL ? [{
      key: Modules.EVENT_BUS,
      resolve: '@medusajs/event-bus-redis',
      options: {
        redisUrl: REDIS_URL
      }
    }] : []),
    // Only run workflow engine on non-server modes to avoid idle Redis usage on the web instance
    ...(REDIS_URL && WORKER_MODE !== 'server' ? [{
      key: Modules.WORKFLOW_ENGINE,
      resolve: '@medusajs/workflow-engine-redis',
      options: {
        redis: {
          url: REDIS_URL,
        }
      }
    }] : []),
    ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL || RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
      key: Modules.NOTIFICATION,
      resolve: '@medusajs/notification',
      options: {
        providers: [
          ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL ? [{
            resolve: '@medusajs/notification-sendgrid',
            id: 'sendgrid',
            options: {
              channels: ['email'],
              api_key: SENDGRID_API_KEY,
              from: SENDGRID_FROM_EMAIL,
            }
          }] : []),
          ...(RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
            resolve: './src/modules/email-notifications',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: RESEND_API_KEY,
              from: RESEND_FROM_EMAIL,
            },
          }] : []),
        ]
      }
    }] : []),
    // Brak Stripe/Payment providers na tym etapie (użyjemy Paynow plugin później)
  ],
  plugins: [
    // Paynow plugin is implemented as store API routes and module in src/, no external resolve needed.
    // Loyalty plugin via shim (Railway resolution stability)
    {
      resolve: './plugins/loyalty',
      options: {}
    },
    {
      resolve: './plugins/furgonetka',
      options: {
        prefetch: false
      }
    },
    {
      resolve: '@agilo/medusa-analytics-plugin',
      options: {
        // Low stock threshold for alerts (default: 5)
        stock_threshold: 10
      }
    }
  ]
};

export default defineConfig(medusaConfig);
