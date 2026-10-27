# Maretinda on DigitalOcean + Cloudflare

Production moves off GCP to a single droplet. Target cost: **~$24/month** plus pennies.

| Piece | Runs on | Domain |
|---|---|---|
| Medusa backend (API + background jobs) | Droplet, Docker | api.maretinda.com |
| Storefront (Next.js) | Droplet, Docker | maretinda.com |
| Postgres 17 + pgvector, Redis | Droplet, Docker | — (not exposed) |
| Admin panel, seller panel | Cloudflare Pages | admin.maretinda.com, seller.maretinda.com |
| Marketing website (static export) | Cloudflare Pages | about.maretinda.com |
| Uploaded images, videos, seller documents | Cloudflare R2 bucket `maretinda-media` | media.maretinda.com |
| Nightly DB backups | Cloudflare R2 bucket `maretinda-backups` | — |

Cloudflare sits in front of everything (DNS, CDN, HTTPS, firewall).

GCP is gone (billing removed Oct 2026). Production was restored from the
2026-10-23 backup in `~/Backups/maretinda-2026-10-23/maretinda-prod/`, with
image links rewritten from `storage.googleapis.com/maretinda-prod-uploads/` to
`media.maretinda.com/`. The backend picks R2 whenever `S3_ENDPOINT` and
`S3_BUCKET` are set (`backend/src/utils/r2-storage.ts`, `medusa-config.ts`).

Files here:

- `docker-compose.yml`, `Caddyfile` — what runs on the server (`/opt/maretinda`)
- `scripts/bootstrap-server.sh` — one-time droplet setup
- `scripts/restore-db.sh` — loads a Cloud SQL export or a nightly backup
- `scripts/upload-media.sh` — one-time copy of the old uploads into R2
- `scripts/release.sh` — switches backend/store to a new image, with migration and auto-rollback
- `scripts/backup-db.sh` — nightly `pg_dump` → R2
- `../.github/workflows/deploy-do.yml` — CI

---

## 1. Accounts (one time)

**Cloudflare** (free plan)
1. Add the site `maretinda.com` and switch the domain's nameservers at the registrar to the two Cloudflare gives you.
2. SSL/TLS → Overview → mode **Full (strict)**.
3. SSL/TLS → Origin Server → **Create certificate** for `maretinda.com, *.maretinda.com`, 15 years. Save the two blocks as `origin.pem` and `origin.key`.
4. R2 → enable it, create buckets **`maretinda-backups`** and **`maretinda-media`** (location hint: Asia-Pacific). On `maretinda-media` → Settings → **Custom Domains** → connect `media.maretinda.com` (this makes the media public; backups stay private). Then *Manage R2 API tokens* → **Object Read & Write**, scoped to those two buckets. Note the Access Key ID, Secret, and Account ID.
5. Workers & Pages → create three **Pages** projects by *Direct Upload*: `maretinda-admin`, `maretinda-seller` and `maretinda-website`, production branch `main`. In each, Custom domains → add `admin.maretinda.com` / `seller.maretinda.com` / `about.maretinda.com`. (CI also creates a missing project on its first deploy, but the custom domain is always a dashboard step.)
6. My Profile → API Tokens → create a token with **Account › Cloudflare Pages › Edit** (for CI).

**DigitalOcean**
1. Create a Droplet: Ubuntu 24.04, region **Singapore (SGP1)**, Basic → Regular → **2 vCPU / 4 GB ($24/mo)**, SSH key authentication. Leave the Backups add-on off (R2 covers the database; the server is rebuilt from this folder). Turn on the free Monitoring agent.
2. Networking → Firewalls → create one for the droplet: inbound **22** from your IP, **80 and 443 from Cloudflare's IP ranges only** (https://www.cloudflare.com/ips/). This stops anyone bypassing Cloudflare.
3. Billing → **Billing alerts** → alert at $35.

## 2. Set up the server

```bash
# from the repo root on your laptop
IP=<droplet-ip>
scp deploy/scripts/bootstrap-server.sh root@$IP:
ssh root@$IP bash bootstrap-server.sh

```

`backend.env` was assembled from the old Cloud Run config plus local `backend/.env`
(Secret Manager was unreachable without billing); JWT/COOKIE secrets were generated
on the server. GiyaPay credentials live in the database (`giyapay_config`).

```bash
rsync -r --exclude gcp-export --exclude README.md deploy/ deploy@$IP:/opt/maretinda/
scp origin.pem origin.key deploy@$IP:/opt/maretinda/certs/

ssh deploy@$IP
cd /opt/maretinda
chmod 600 .env backend.env store.env certs/*
nano .env          # R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
nano backend.env   # S3_ENDPOINT, S3_BUCKET, S3_REGION=auto, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_FILE_URL
scripts/upload-media.sh restore/uploads
scripts/restore-db.sh restore/medusa-r2.sql.gz
```

The restore prints any SQL errors. Errors mentioning `cloudsql*` roles or "already exists" are expected; anything about a missing table is not.

**DNS** (Cloudflare → DNS, all *Proxied* / orange cloud):

| Type | Name | Content |
|---|---|---|
| A | `@` | droplet IP |
| A | `api` | droplet IP |
| CNAME | `www` | `maretinda.com` |

(`admin`, `seller` and `about` records are created by Pages in step 1.5.)

## 3. CI

Make a key pair just for CI and allow it on the server:

```bash
ssh-keygen -t ed25519 -f ci_deploy -N "" -C github-actions
ssh deploy@$IP 'cat >> ~/.ssh/authorized_keys' < ci_deploy.pub
```

GitHub → repo → Settings → Secrets and variables → Actions → **Secrets**:

| Secret | Value |
|---|---|
| `DO_HOST` | droplet IP |
| `DO_SSH_KEY` | contents of `ci_deploy` (private key) |
| `DO_SSH_KNOWN_HOSTS` | output of `ssh-keyscan $IP` |
| `CLOUDFLARE_API_TOKEN` | Pages token from step 1.6 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

Then delete the local `ci_deploy` files. The workflow file must be on the `production` branch before it can be run against it:

```bash
gh workflow run deploy-do.yml --ref production -f services=all
gh run watch
```

The first backend build takes ~15 min; later ones reuse the build cache.

## 4. Check before cutover

- [ ] `curl https://api.maretinda.com/health` → `OK`
- [ ] maretinda.com loads products; search (Algolia) works
- [ ] Log in to admin.maretinda.com and seller.maretinda.com
- [ ] Upload a product image in the seller panel (proves the GCS key)
- [ ] Customer sign-up, Google login, COD test order, order emails
- [ ] GiyaPay sandbox payment (callback reaches `api.maretinda.com`)
- [ ] `ssh deploy@$IP /opt/maretinda/scripts/backup-db.sh` → a file appears in R2 under `postgres/`

Outside this repo, check:
- **Google Sign-in**: the OAuth client lives in the billing-less `maretinda-prod` project and its callback (`https://maretinda.com/api/auth/google/callback`) is unchanged. If sign-in fails, create a new OAuth client in any Google Cloud project (no billing needed) and update `GOOGLE_CLIENT_*` in `backend.env`.
- **GiyaPay** merchant settings, if callback/notify URLs are registered on their side.

## 5. Go live

```bash
gh variable set DO_DEPLOY_ENABLED --body true          # pushes to production now deploy here
gh workflow disable prod-deploy.yml                     # the GCP pipeline can no longer succeed
rm -rf deploy/gcp-export
```

---

## Day to day

| Task | Command (on the server, in `/opt/maretinda`) |
|---|---|
| Logs | `docker compose logs -f --tail 200 backend` |
| Status / memory | `docker compose ps` · `docker stats --no-stream` |
| Roll back | `docker images maretinda/backend` → `scripts/release.sh backend <older-sha>` |
| Restore a backup | download from R2 → `scripts/restore-db.sh <file>.dump` |
| Backup log | `tail /var/backups/maretinda/backup.log` |

**Known limits**
- A backend release restarts Medusa: ~30–60 s of API errors. Deploy at quiet hours.
- Cloudflare's free plan caps request bodies at **100 MB**: larger reel videos can't be uploaded.
- Everything in `maretinda-media` is public by URL — including seller application documents (permits, BIR certificates), exactly as on GCS before. Moving those to a private bucket with signed URLs is a worthwhile follow-up.
- One server: if it is down, the site is down. That is the trade for the price at this stage.

## Scaling

| Stage | When | Change |
|---|---|---|
| 1 | Memory/CPU above ~70% for days | Droplet → Resize → **CPU and RAM only** (keeps the option to shrink back), 8 GB / $48. Then in `.env`: `MEDUSA_WORKER_MODE=server` and `COMPOSE_PROFILES=split`, and `docker compose up -d`. |
| 2 | Real revenue / data you can't lose | DigitalOcean Managed Postgres (point-in-time restore); point `DATABASE_URL` at it and drop the `postgres` service. |
| 3 | Sustained heavy traffic | Several app droplets behind a load balancer + managed Postgres/Redis, or back to GCP with startup credits. The app already supports it. |
