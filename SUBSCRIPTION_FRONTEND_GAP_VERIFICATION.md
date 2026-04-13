# Subscription Frontend Gap Verification

## Covered Routes
- `/pricing` public render with plan cards, quick reference table, feature matrix.
- `/subscription/upgrade?plan=<id>` auth-required upgrade page.
- `/subscription/payment/<intentId>` auth-required payment status page.

## Covered Flows
1. Public pricing -> login -> upgrade -> payment status.
   - Spec: `tests/e2e/subscription-flow.spec.ts`
2. Pricing CTA states for authenticated and unauthenticated users.
   - Spec: `tests/e2e/subscription-pricing-states.spec.ts`
3. Pending plan resume after phone OTP + set-password + login.
   - Spec: `tests/e2e/subscription-pricing-states.spec.ts`
4. Pending plan resume after phone OTP direct authenticated path.
   - Spec: `tests/e2e/subscription-pricing-states.spec.ts`
5. Pending plan resume after email verification -> login.
   - Spec: `tests/e2e/subscription-pricing-states.spec.ts`
6. Payment status lifecycle rendering (PENDING, MANUAL_REVIEW, FAILED, EXPIRED, COMPLETED).
   - Spec: `tests/e2e/subscription-payment-statuses.spec.ts`

## Run Command
```bash
cd /home/alamin/IdeaProjects/dokaniai_front
CI=1 npm run e2e -- \
  tests/e2e/subscription-flow.spec.ts \
  tests/e2e/subscription-pricing-states.spec.ts \
  tests/e2e/subscription-payment-statuses.spec.ts
```

## Result Log
- [ ] Attach latest Playwright pass output.
- [ ] Attach failures (if any) with route and selector details.
- [ ] Confirm locale-sensitive text assertions are stable for `en` and `bn`.
