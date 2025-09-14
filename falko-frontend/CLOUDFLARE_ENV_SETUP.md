## PILNE - Cloudflare Pages Build Failure Fix

### Błąd:
```
[Error: Failed to collect configuration for /login] {
  [cause]: Error: [API_CONFIG] Brak poprawnej NEXT_PUBLIC_MEDUSA_BACKEND_URL w produkcji
```

### Fix - Ustaw w Cloudflare Dashboard:

1. **Idź do Cloudflare Dashboard:**
   ```
   https://dash.cloudflare.com/[account]/pages/[project]/settings/environment-variables
   ```

2. **Dodaj Production Environment Variables:**
   ```
   NEXT_PUBLIC_MEDUSA_BACKEND_URL = https://backend-server-production-030d.up.railway.app
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = pk_01J7QF8Z9X8J7QF8Z9X8J7QF8Z
   ```

3. **WAŻNE - Deploy ponownie:**
   - Pages > Deployments > "Retry deployment"
   - Lub push nowy commit

### Dlaczego się nie udało:
- Cloudflare Pages potrzebuje env vars z Dashboard **podczas buildu**
- `wrangler.toml [vars]` działają tylko w runtime
- Build czyta zmienne z Dashboard, nie z repo

## Problem
- `NEXT_PUBLIC_*` zmienne muszą być dostępne podczas **BUILD TIME** (Next.js je inline'uje)
- `wrangler.toml [vars]` działają tylko podczas **RUNTIME**
- Dlatego wrangler vars NIE DZIAŁAJĄ dla NEXT_PUBLIC_*

## Rozwiązanie

### 1. Build-time Environment Variables
Dla zmiennych `NEXT_PUBLIC_*` ustaw je w **Cloudflare Pages Dashboard**:

```
Pages > [Twój projekt] > Settings > Environment variables > Production
```

Dodaj:
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL = https://backend-server-production-030d.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = pk_01J7QF8Z9X8J7QF8Z9X8J7QF8Z
```

### 2. Runtime Variables (opcjonalne)
Zmienne NIE-publiczne możesz trzymać w `wrangler.toml`:

```toml
[vars]
# Server-side only vars (nie NEXT_PUBLIC_*)
INTERNAL_API_KEY = "secret-key"
WEBHOOK_SECRET = "webhook-secret"
```

### 3. Lokalna Konfiguracja (dev/test)
Użyj `.env.production.local` dla lokalnych buildów produkcyjnych.

## Workflow

### Lokalny build/test:
```bash
NODE_ENV=production npm run build:cf  # używa .env.production.local
```

### Cloudflare Pages deployment:
- Automatycznie pobiera env vars z Dashboard
- Build command: `npm run build:cf` 
- Zmienne z Dashboard są dostępne podczas buildu

## Security
- `NEXT_PUBLIC_*` są publiczne (widoczne w bundle)
- Publishable key jest bezpieczny (publiczny zgodnie z Medusa docs)
- Nigdy nie dodawaj admin keys do NEXT_PUBLIC_*

## Files
- `.env.production.local` - tylko lokalne buildy
- `wrangler.toml` - runtime vars (server-side)
- Cloudflare Dashboard - build-time vars (NEXT_PUBLIC_*)