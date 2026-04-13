# E2E Tests

This folder contains Playwright end-to-end tests for subscription architecture flows.

## Covered flow

- Public pricing page
- Unauthenticated upgrade click redirects to login
- Login resumes pending upgrade intent
- Upgrade page initializes payment intent
- Payment status page route renders and fetches status

## Run locally

```bash
npm run e2e
```

## Headed mode

```bash
npm run e2e:headed
```

