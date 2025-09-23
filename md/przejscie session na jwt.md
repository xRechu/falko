Dzięki — zrobiłem szybkie, celowane porównanie naszego projektu z working-template pod kątem Auth/Session. Poniżej najważniejsze różnice, które mają bezpośredni wpływ na problem z wymianą tokenu na sesję.

Backend

Modules.AUTH: w medusa-config.js (nasz) jest skonfigurowany Modules.AUTH z @medusajs/auth i providerem @medusajs/auth-emailpass (cookie: SameSite=None, Secure, Domain=.falkoprojects.com). W template (medusa-config.js) modułu AUTH w ogóle nie ma.
Wersje Medusy: nasz package.json to 2.8.8 (framework, medusa, auth), template używa 2.10.2 (nowszy core, brak pakietów auth). Różnice wersji mogą zmieniać zachowanie endpointów auth/session.
CORS/middlewares: nasz projekt ma własne middleware CORS dla /store/*, /auth/*, /admin/* w middlewares.ts oraz dedykowany cors-middleware.ts i per-route nagłówki (np. health, inventory, prices, furgonetka). Template nie ma custom CORS middleware — opiera się na standardowej konfiguracji Medusy.
Frontend — podejście do uwierzytelniania

Tryb sesji vs JWT:
Nasz: medusa-client.ts jawnie ustawia auth: { type: 'session' } w JS SDK i wymusza credentials: 'include' + x-publishable-api-key dla fetchy. Oczekujemy, że backend ustawi cookie sesyjne po POST /auth/session.
Template: config.ts nie ustawia trybu session w SDK. Zamiast tego w logice konta (customer.ts) po sdk.auth.register/login(...) otrzymany token jest zapisywany w ciasteczku serwerowym _medusa_jwt (cookies.ts), a kolejne żądania używają nagłówka Authorization: Bearer <token> (przez getAuthHeaders()), bez polegania na cookie sesyjnym.
Przepływ rejestracji/logowania:
Template:
Rejestracja: sdk.auth.register(...) → token → sdk.store.customer.create(..., { Authorization: Bearer token }) → sdk.auth.login(...) → setAuthToken(token) zapisuje JWT do _medusa_jwt.
Logowanie: sdk.auth.login(...) → setAuthToken(token) → dalsze żądania z Authorization: Bearer.
Nasz: w auth-medusa-docs.ts próbujemy po register/login ręcznie wywołać POST /auth/session (z Authorization: Bearer <token>) i liczymy na Set-Cookie. Dodatkowo plik zawiera zdublowane, niespójne fragmenty (widać dwa alternatywne podejścia naraz), co utrudnia utrzymanie jednej ścieżki.
Endpointy i oczekiwany format

SDK a /auth/session: z buildów Next widać, że JS SDK w trybie session po zalogowaniu sam wywołuje POST /auth/session z nagłówkiem Authorization: Bearer <token>. Nie wysyła tokenu w body.
Nasz raport sugeruje aktorową ścieżkę POST /auth/customer/session i token w body { token }. Template tego nie używa wcale — trzyma się JWT w nagłówkach, więc nie potrzebuje wymiany tokenu na cookie sesyjne.
To tworzy rozjazd: mamy skonfigurowany Modules.AUTH i tryb session w SDK (który dzwoni na globalne /auth/session), podczas gdy część naszej logiki oczekuje aktorowego endpointu lub innego formatu.
Ustawienia cookie i domeny

Nasz provider wymusza SameSite=None, Secure, Domain=.falkoprojects.com. To poprawne dla cross-site, ale:
W środowisku dev (inne hosty/porty) cookie z Domain=.falkoprojects.com nie zapisze się.
Template nie polega na Set-Cookie z backendu — operuje na _medusa_jwt ustawianym po stronie Next (SSR), co upraszcza CORS/cookie-attributes i unika 401 z /auth/session.
Wnioski (implikacje dla obecnego błędu)

Podejścia są różne: template działa w 100% na JWT w nagłówku (bez sesji), my wymuszamy sesję cookie. Stąd 401 na POST /auth/session nie występuje w template, bo w ogóle nie zachodzi.
Dodatkowo mamy:
Różnice wersji (2.8.8 vs 2.10.2), które mogły zmienić zachowanie endpointów auth.
Moduł AUTH u nas vs brak w template.
Możliwą niedopasowaną ścieżkę/formatu wymiany tokenu (globalne /auth/session z Authorization vs oczekiwanie /auth/customer/session z body).
Surowe atrybuty cookie (Domain, SameSite) mogą blokować zapis w realnym środowisku przeglądarki, jeśli domena/Origin nie pasują idealnie.
Jeśli chcesz, mogę:

Zestawić precyzyjny diff plików związanych z auth (ścieżki, nagłówki, body) i zaproponować dwa spójne warianty: 1) przejście na „template style” (JWT w _medusa_jwt + Authorization) albo 2) dociągnięcie „session style” (zweryfikować właściwy endpoint/format i zgodność wersji). Poleć, który wariant wolisz, a przygotuję minimalny, spójny zestaw zmian.