# Furgonetka Plugin (Lightweight)

Cel: minimalna, produkcyjna integracja bez Redis (Railway friendly).

Funkcje:
- Rejestracja singletonu `furgonetkaOAuth` w kontenerze
- Opcjonalny prefetch usług (ENV `FURGONETKA_FEATURE_PREFETCH=1`)

Sterowanie ENV:
```
FURGONETKA_FEATURE_PREFETCH=0|1
FURGONETKA_POINTS_CACHE_TTL=600000
FURGONETKA_LOCAL_RATE_LIMIT=0
FURGONETKA_BREAKER_FAILURE_THRESHOLD=0
```

Rozszerzenia (później): tracking sync, label generation, enriched admin widgets.
