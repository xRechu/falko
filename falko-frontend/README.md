# Falko Frontend

## Deployment na Cloudflare Pages (SSR App Router)

Cloudflare Pages domyślnie serwuje statyczne assety. Aby zachować SSR / dynamiczne route (`/products/[handle]`) używamy adaptera `@cloudflare/next-on-pages`.

### Kroki
1. Upewnij się że repo zawiera `wrangler.toml` (jest w tym katalogu).
2. W Cloudflare Pages ustaw:
   - Build command: `npm run build:cf`
   - Build output directory: `.vercel/output/static` (generowane przez adapter) – NIE `.next`.
   - Node version: 22 (auto) lub zgodna.
3. Environment Variables (Pages > Settings > Environment Variables):
   - `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
   - `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
   (opcjonalnie duplikaty bez `NEXT_PUBLIC_` jeśli planujemy używać ich po stronie serwera runtime Functions).
4. Po deploy logi powinny zawierać krok `@cloudflare/next-on-pages`. Wygenerowany katalog `.vercel/output/functions` będzie zawierać funkcje dla dynamicznych route.

### Lokalny build testowy
```bash
npm ci
npm run build:cf
npx wrangler pages dev .vercel/output/static --compatibility-date=$(date +%Y-%m-%d)
```
> Alternatywnie: `npx @cloudflare/next-on-pages build && npx wrangler pages dev .vercel/output` (gdy wskazujemy root output).

### Dlaczego strona była pusta?
Poprzednio Pages publikował tylko statyczną zawartość `.next` bez warstwy funkcji (log: `Note: No functions dir at /functions found.`). App Router strony oznaczone jako `○` były prerenderowane i działały, ale routing/asset mismatch + brak `_headers` poprawnego oraz możliwe błędne output directory powodowały 404/blank. Adapter tworzy poprawną strukturę funkcji i manifesty.

### Czysty rollback
Jeśli chcemy wrócić do standardowego hostingu (np. Vercel), usuwamy `wrangler.toml` i zależność `@cloudflare/next-on-pages`, przywracamy build `next build` i output `.next`.

### Security Headers
Nagłówki ustawiane są w `next.config.ts` (funkcja `headers()`). Cloudflare może nadpisać niektóre (np. HSTS) jeśli włączone jest `Always Use HTTPS`.

## Skróty
- Production build Pages: `npm run build:cf`
- Standard build: `npm run build`
