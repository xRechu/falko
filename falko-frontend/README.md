## Falko Frontend

Next.js 14 (App Router) frontend projektu Falko, wydzielony z monorepo `falko-project`.

### Stos
- Next.js / React
- TypeScript
- Tailwind CSS
- Integracje: Medusa, PayNow, (Furgonetka – punkty odbioru), Supabase (auth / dane)

### Szybki start lokalnie
```bash
npm install
npm run dev
```
Domyślnie aplikacja uruchomi się na `http://localhost:3000`.

### Zmienne środowiskowe
Skopiuj `.env.local.example` do `.env.local` i uzupełnij wartości. Pliki `.env*` są ignorowane (patrz `.gitignore`). Nie commituj sekretów.

### Deploy na Cloudflare Pages (skrót)
1. Utwórz nowy projekt w Cloudflare Pages wskazując repo `xRechu/falko-frontend`.
2. Framework preset: `Next.js`.
3. Build command: `npm run build` (lub pozostaw automatyczne wykrycie).
4. Output directory: `.vercel/output/static` (dla Next.js 14 jeżeli używasz trybu statycznego) lub pozostaw puste jeśli Cloudflare wykryje dynamiczny adapter. Jeśli generujesz SSR, użyj funkcji Pages + eksperymentalny adapter Next (Cloudflare zwykle automatycznie ustawi).
5. Dodaj wszystkie wymagane zmienne środowiskowe w sekcji Settings > Environment Variables.

Jeżeli używasz funkcji Edge / middleware upewnij się, że wersja Next.js jest wspierana przez Cloudflare (>=13.5). W razie problemów z dynamicznymi funkcjami rozważ migrację do trybu statycznego dla kluczowych stron lub użycie `output: export` (uwaga: ograniczenia dla API routes / dynamic).

### Struktura katalogów (wycinek)
```
app/              # App Router pages & route handlers
components/       # Komponenty UI / domenowe
lib/              # Klienci API, utilsy, konfiguracja
public/           # Assets statyczne
```

### Kontrybucje
Branch główny: `main`. Używaj konwencji commitów typu Conventional Commits (feat:, fix:, chore:, refactor: ...). Pull requesty mile widziane.

### Licencja
Wewnętrzna / prywatna (ustal wg potrzeb). Dodaj LICENCE gdy projekt stanie się publiczny.

---
Ten plik został dodany automatycznie przy wydzielaniu frontendu z monorepo.