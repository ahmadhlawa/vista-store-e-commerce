# Template origin

This repository is the **Vista Store** client instance. It was created by cloning the
Golden Commerce Template, not by copying a working directory, so no `.env`, database,
upload, `node_modules`, `dist` or virtual-environment file was carried across.

| Item | Value |
| --- | --- |
| Client slug | `vista-store` |
| Source repository (local) | `D:\Project\commerce-template` |
| Source remote | `https://github.com/ahmadhlawa/commerce-template.git` |
| Source branch | `main` |
| Source commit | `dba6a67a09d9326a8b7fa43f95adcf749b2e3e76` |
| Source commit subject | `chore: remove tracked runtime artifacts` |
| Source commit date | 2026-08-01 16:38:40 +0300 |
| Template version at clone | `0.3.0-rc.1` (see `VERSION`) |
| Cloned on | 2026-08-02 |
| Client work branch | `feat/vista-store-initial-release` |

## Remotes

```
template-upstream  https://github.com/ahmadhlawa/commerce-template.git
```

There is **no `origin`**. No client remote has been supplied, so nothing is pushed from
this repository. When the client's remote exists:

```powershell
git remote add origin <client-remote-url>
git push -u origin feat/vista-store-initial-release
```

`template-upstream` is fetch-only in practice. Never push to it — it is the shared
Golden Template and this repository carries client-specific data.

## Pulling later template releases

```powershell
git fetch template-upstream
git log --oneline HEAD..template-upstream/main   # what is new upstream
git merge template-upstream/main                 # resolve conflicts deliberately
```

Client-specific files that will usually conflict, and where the client value wins:

- `instance/vista-store.yaml` — client only, upstream has no such file
- `README.md` title and quick-start paths
- `backend/.env.example` → `APP_NAME`
- `frontend/package.json` → `name`
- `docs/client/*`, `docs/deployment/cpanel-*`, this file

## Divergence from the template

Work added in this repository that does not exist upstream at `dba6a67`:

- Order invoicing (`Invoice`, `InvoiceItem`, `InvoiceSequence`, migration `0003`)
- Invoice/tax/manual-payment fields on `store_settings` (migration `0003`)
- Admin invoice API and the `/admin/invoices` screens
- The Vista Store instance profile and client documentation
- cPanel capability checklist, handoff notes and the release-package script

If these prove generally useful they should be contributed back upstream rather than
kept as a permanent client fork.
