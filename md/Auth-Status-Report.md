# Status: Rejestracja i logowanie – analiza i wdrożone zmiany

Ostatnia aktualizacja: [wstaw po deployu]

## Aktualny objaw (błąd)
- Provider emailpass działa poprawnie:
  - POST `/auth/customer/emailpass` → 200 i zwraca `token` (JWT). W logach sieci widać poprawny JSON `{ token: "..." }`.
- Wymiana tokenu na sesję nie działa:
  - POST `/auth/session` → 401 `Unauthorized`, brak nagłówka `Set-Cookie` w odpowiedzi.
  - Skutkiem tego kolejne żądania (np. GET `/store/customers/me`) zwracają 401, bo przeglądarka nie ma ustawionego cookie sesyjnego.

## Co zostało zrobione (chronologicznie i tematycznie)

### Backend (Medusa)
1. Włączono moduł Auth zgodnie z dokumentacją Medusa v2:
   - Dodano zależności:
     - `@medusajs/auth@2.8.8`
     - `@medusajs/auth-emailpass@2.8.8`
   - Skonfigurowano moduł w `backend/medusa-config.js`:
     - `Modules.AUTH` z providerem:
       ```js
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
       }
       ```
   - Uwaga: konfiguracja cookie wymusza atrybuty wymagane przez przeglądarki dla cross-site cookies.
2. CORS i cookies:
   - `backend/src/api/cors-middleware.ts` – dozwolone originy: `https://falkoprojects.com`, `https://www.falkoprojects.com`, nagłówki `x-publishable-api-key`, `Access-Control-Allow-Credentials: true` i `Vary: Origin`.
   - `backend/src/api/health/route.ts` – dynamiczne `Access-Control-Allow-Origin` zgodnie z nagłówkiem `Origin`.

### Frontend (Storefront)
1. SDK i nagłówki:
   - `falko-frontend/lib/medusa-client.ts` – wymuszono `credentials: 'include'` oraz nagłówek `x-publishable-api-key` dla wywołań w przeglądarce.
2. Poprawiono sygnatury wywołań SDK Auth (zgodne z v2):
   - Zmieniono format na: `sdk.auth.register("customer", "emailpass", { email, password })` i `sdk.auth.login("customer", "emailpass", { email, password })`.
3. Zmieniono logikę po stronie rejestracji/logowania (`lib/api/auth-medusa-docs.ts`):
   - Po rejestracji:
     1) pobranie tokenu od providera (emailpass),
     2) utworzenie profilu klienta: `POST /store/customers` z `Authorization: Bearer <token>` (linkowanie identity → customer),
     3) wymiana tokenu na sesję: `POST /auth/session` (ustawienie cookie),
     4) `GET /store/customers/me`.
   - Po logowaniu:
     1) pobranie tokenu od providera (emailpass),
     2) wymiana tokenu na sesję: `POST /auth/session`,
     3) `GET /store/customers/me`.

## Co działa
- Provider emailpass (krok 1) – zwraca token (200). W logach widać poprawną odpowiedź `{ token: "..." }`.

## Co nadal nie działa
- Wymiana tokenu na sesję (krok 2/3) → `POST /auth/session` zwraca 401, nie pojawia się `Set-Cookie`. 
- W starszych logach JWT z providera zawierał `actor_id: ""` – to zgodne ze stanem przed utworzeniem profilu `customer`. Dlatego wprowadzono krok tworzenia profilu przed wymianą na sesję.

## Hipotezy i kierunek naprawy (zgodnie z dokumentacją)
1. Endpoint sesji i format:
   - Dla actor scope `customer` często wykorzystuje się ścieżkę actorową: `POST /auth/customer/session` zamiast globalnego `POST /auth/session`.
   - Wymiana tokenu na sesję może oczekiwać `token` w body JSON (nie tylko w nagłówku `Authorization`).
2. Linkowanie identity → customer:
   - Dla świeżej rejestracji token provider-a nie ma jeszcze `actor_id`. `POST /store/customers` z `Authorization: Bearer <token>` linkuje identity do aktora (customer). To zostało zaimplementowane.
3. Konfiguracja modułu i sekrety:
   - Upewnić się, że `JWT_SECRET` i ewentualne sekrety modułu Auth są spójne (moduł i HTTP). 

## Zaproponowane dalsze kroki
- [Frontend] Zmiana wymiany sesji na actorową ścieżkę z tokenem w body:
  - `POST /auth/customer/session` z body `{ token }` oraz `credentials: 'include'` i `x-publishable-api-key`.
- [QA] Zweryfikować w DevTools/Network po rejestracji i logowaniu:
  1) `/auth/customer/emailpass` → 200 z `{ token }`.
  2) (Rejestracja) `/store/customers` → 201/200.
  3) `/auth/customer/session` → 200 oraz nagłówek `Set-Cookie` zawierający `SameSite=None; Secure;` (opcjonalnie `Domain=.falkoprojects.com`).
  4) `/store/customers/me` → 200.
- [Backend] Jeżeli po powyższym kroku nadal 401, dodać na czas QA endpoint diagnostyczny (np. `/auth/echo`) lub logi w handlerze sesji, aby potwierdzić, jak moduł Auth widzi token i akceptowalnego aktora.
- [Porównanie] Zreferencjonować działający szablon (boilerplate Railway), przenieść 1:1 różnice w konfiguracji modułu Auth (provider, endpoint sesji, format body tokenu, cookie policy, sekrety).

## Istotne dane z logów
- `POST /auth/customer/emailpass` → 200, `{ token: "…" }`.
- `POST /auth/session` → 401, odpowiedź `{ "message": "Unauthorized" }`. Brak `Set-Cookie`.
- DevTools pokazywał, że provider wywoływany jest przed sesją (prawidłowo). 

---

## Podsumowanie
Zaimplementowaliśmy poprawną konfigurację modułu Auth i providera emailpass w backendzie oraz zmieniliśmy przepływ po stronie frontu (token → create customer → session exchange). Obecnie provider zwraca token (200), ale wymiana tokenu na sesję przy `POST /auth/session` zwraca 401. Kolejny krok to dostosowanie wywołania sesji do actorowej ścieżki `POST /auth/customer/session` z tokenem w body JSON i weryfikacja nagłówków `Set-Cookie`. W razie dalszych problemów porównamy konfigurację z działającym szablonem Railway i dodamy minimalne logi diagnostyczne na czas QA.
