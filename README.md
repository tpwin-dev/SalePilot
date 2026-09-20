# SalePilot

SalePilot is a local-first universal point-of-sale application. It is being built
in small, verified milestones so the codebase remains understandable and the
business rules remain reliable.

## Technology

- React renders the user interface from components.
- TypeScript checks data shapes and catches mistakes before runtime.
- Vite runs the development server and creates production builds.
- Vitest verifies business logic with automated tests.
- ESLint and Prettier keep the source consistent.

## Start developing

Install Node.js 24, then run:

```sh
npm install
npm run dev
```

Before considering work complete, run the complete quality gate:

```sh
npm run check
```

## Source structure

```text
src/
  app/       Application composition and top-level UI
  core/      Provider-neutral business and infrastructure contracts
  features/  User-facing POS capabilities (added as they are built)
  shared/    Reusable UI and utilities, including localization
```

Code in `core` must not depend on a browser database or cloud vendor. Concrete
providers will implement the contracts defined there. Database changes are
versioned migrations and must be tested before release.

## Working agreements

- Store money as integer minor units, not floating-point values.
- Keep posted sales and inventory movements append-only.
- Never commit passwords, API keys, `.env` files, or customer data.
- Add English and Myanmar text through the localization message catalogue.
- Complete and verify one roadmap milestone before starting the next.

See [POS_FEATURE_ROADMAP.md](./POS_FEATURE_ROADMAP.md) for the product roadmap.
