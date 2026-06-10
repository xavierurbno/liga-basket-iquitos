# Fase 6 — Billing Stripe + onboarding self-service

## Flujo comercial

```
/signup → cuenta + plan (cookie onboarding_plan)
/onboarding/league → crea liga + LEAGUE_ADMIN (comprador)
/onboarding/billing → Stripe Checkout (Starter/Pro)
/liga/ → panel operativo
```

SUPER_ADMIN ya no es requisito para nuevas ligas comerciales.

## PR 6.1 — Stripe

### Catálogo (`src/lib/billing/plan-catalog.ts`)

| Plan | Jugadores | Torneos activos | Stripe |
|------|-----------|-----------------|--------|
| Free | 200 | 2 | — (14 días trial) |
| Starter | 500 | 5 | `STRIPE_PRICE_STARTER` |
| Pro | 2000 | 20 | `STRIPE_PRICE_PRO` |

### API

| Ruta | Función |
|------|---------|
| `POST /api/stripe/webhook/` | `checkout.session.completed`, `customer.subscription.updated/deleted` |

### Actions

- `createStripeCheckoutAction` — Checkout Session
- `createStripePortalAction` — Customer Portal

### Persistencia

Webhooks → `sync-league-plan-from-stripe.ts` → `leaguePlanRepository.upsertFromStripe` (`stripe_customer_id`, `stripe_subscription_id`, tier, límites).

## PR 6.2 — Signup / onboarding

| Ruta | Archivo |
|------|---------|
| `/signup/` | `src/app/signup/page.tsx` |
| `/onboarding/league/` | `src/app/onboarding/league/page.tsx` |
| `/onboarding/billing/` | `src/app/onboarding/billing/page.tsx` |

Servicios compartidos:

- `createLeagueCore` — ligas + settings + plan
- `linkUserAsLeagueAdmin` — primer usuario = LEAGUE_ADMIN

## PR 6.3 — Gates + upgrade

`assert-league-plan-limit.ts` devuelve `{ message, upgradePath, code }`:

- Trial expirado (plan free)
- Máx. jugadores / torneos

CTA: `/onboarding/billing/` vía `PlanUpgradeCTA` y campo `upgradePath` en actions.

## PR 6.4 — Hardening

Variables (`src/lib/billing/signup-config.ts`):

| Variable | Efecto |
|----------|--------|
| `SIGNUP_ENABLED=false` | Cierra registro |
| `SIGNUP_INVITE_ONLY=true` + `SIGNUP_INVITE_TOKEN` | Solo con `?invite=` |
| `SIGNUP_ALLOWED_EMAIL_DOMAINS` | Allowlist de dominios |
| `MASTER_SUPER_ADMIN_EMAIL` | Bloqueado en signup |

Pendiente operacional: emails transaccionales trial expiring (Edge Function o Resend).

## Variables de entorno

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
SIGNUP_ENABLED=true
```

## Stripe Dashboard

1. Productos Free (referencia), Starter, Pro con precios recurrentes mensuales
2. Webhook endpoint: `https://tu-dominio/api/stripe/webhook/`
3. Customer Portal activado

## Local

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook/
```

## Rollback signup

```env
SIGNUP_ENABLED=false
```

Las ligas existentes y cobros Stripe no se ven afectados.
