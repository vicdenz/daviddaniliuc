# Modal compute

The website, `/prep` login, problem library, and saved work stay on Vercel/Supabase. Only the isolated Python/C++ execution moves to Modal. `PREP_EXECUTION_PROVIDER` selects `vercel` (the default) or `modal`; a failed Modal run never silently spends Vercel's allowance.

## Connect and prepare

Use Node.js 22 or newer for the Modal JavaScript SDK.

1. Create or sign in to your [Modal account](https://modal.com/). Authenticate locally with `uvx --from modal modal token new` (or `modal token new` with the Python CLI installed). This stores a token in `~/.modal.toml`; do not put it in Git or chat. The JavaScript SDK also accepts `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET` in an ignored `.env.local` file.
2. Run `npm run setup:prep:modal`. It creates/looks up the `prep` Modal app and builds a reusable Python 3.12 image containing pytest, g++, and coreutils. The image runs as an unprivileged `prep` user. Copy the printed `PREP_MODAL_IMAGE_ID` into `.env.local`. `PREP_MODAL_APP` defaults to `prep`; `PREP_MODAL_ENVIRONMENT` defaults to `main`.
3. Apply `supabase/migrations/20261024010000_prep_modal_usage.sql` with `npx supabase db push`. It adds a provider and estimated cost to the existing private ledger, preserves Vercel history, and exposes a separate private Modal summary. The old Vercel summary excludes Modal entries, so preview usage cannot contaminate production's Vercel meter.
4. Set `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`, `PREP_MODAL_IMAGE_ID`, and `PREP_EXECUTION_PROVIDER=modal` for local development and Vercel **Preview** first. Use Vercel's server-side environment settings/CLI. Optional app/environment overrides must match the setup step. All values are server-only; none use `NEXT_PUBLIC_` or `VITE_` prefixes.
5. Run `npm run test:prep:unit` and `npm run test:prep:modal` (the latter needs Modal credentials/image and checks the real non-root runtime, blocked networking, Python/C++, and timeouts; missing credentials fail this explicit command). Build/start the website, then `npm run test:prep`. The complete HTTP suite works with either provider and creates/removes temporary problems. Deploy a preview and repeat the HTTP suite with `PREP_TEST_URL` pointed at it; Vercel-protected previews also need `PREP_TEST_BYPASS`.
6. After the live Modal preview passes, set the same production environment variables and deploy the reviewed main branch. To roll back compute, set `PREP_EXECUTION_PROVIDER=vercel` and redeploy; retain `PREP_CPP_SNAPSHOT_ID` until the switch is proven. No problem data migration or frontend route change is needed.

Production is not switched by this branch. Credentials, the initial Modal image build, migration application, and a live Modal run are required before activation. The local setup script builds the image ahead of time; requests do not install packages or build images.

## Isolation and execution

Each batch receives a new Sandbox with all outbound network access blocked, no attached secrets/volumes, no OIDC identity token, and a four-minute lifetime. It reserves and caps 0.5 physical CPU cores (one vCPU equivalent) and 2 GiB of memory. The adapter verifies the guest UID before uploading submitted code and rejects root images. The shared runner retains per-process CPU/address-space/file/process limits, disabled privilege escalation, per-case wall timeouts, C++20 compilation, and the full visible test breakdown. Termination is awaited in `finally`, and the SDK client is closed even if termination fails.

The provider adapter supplies filesystem, command execution, and lifecycle operations; judging stays in `prep/hosted/executor.mjs`. The API protocol, persistent jobs, test revision checks, all-case Submit, notes, and editor autosaves are unchanged. Python-native test suites still explain why their cases require Python instead of pretending to support C++.

## Usage and costs

The Modal header shows **estimated app cost**, with an advisory $1/day and rolling $30/30-day planning target. It includes the whole Sandbox lifecycle, including compilation and failed runs, and reserves a full four-minute estimate while a Sandbox is pending or cannot be confirmed stopped. It does not claim actual billing readings or a hard spending limit. Vercel mode retains its existing CPU meter and history.

As checked on 2026-10-24, [Modal Starter](https://modal.com/pricing) advertises $30/month in compute credits. Sandbox pricing is **3× the base CPU/memory rates**: $0.00003942 per physical core-second and $0.00000667 per GiB-second. At the configured caps this app estimates $0.00003305 per elapsed Sandbox second. CPU can be billed on actual usage above its reservation; the hard cap equals the reservation here, so the estimate uses the full configured resource budget. See [Sandbox resources and billing](https://modal.com/docs/guide/sandbox-resources).

The meter is a conservative planning estimate for this app's Sandbox sessions, excludes image builds/storage/other apps, and uses a rolling 30 days rather than your account's billing cycle. Credits and eligibility must be checked in your account; the authoritative cost and spending controls are in Modal's dashboard. Set a workspace budget there before enabling production. No paid plan or production environment is changed by setup.
