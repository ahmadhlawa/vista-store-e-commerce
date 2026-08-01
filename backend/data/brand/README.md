# Seed brand assets

Tracked, version-controlled brand files for Vista Store: logo, favicon, cover art.
Kept separate from `backend/data/vista-uploads/`, which is the runtime media root that
Admin writes into and Git ignores. Mixing the two would put customer-uploaded product
photos into source control and make a brand asset disappear on a fresh clone.

## Current contents: none

No asset could be collected. The supplied Facebook page is login-walled, so its profile
image and cover were never publicly served — see `docs/client/facebook-source-audit.md`.
No image was taken from any other page, and none was generated as a stand-in.

## What to put here

Request the **originals from the owner**, not downloads from Facebook, which re-encodes
and downscales every upload. See items 9–13 in `docs/client/data-needed-from-owner.md`.

| File | Wanted |
| --- | --- |
| `logo.svg` or `logo.png` | Vector, or ≥ 1024px wide PNG with a transparent background |
| `favicon.png` | Square, ≥ 512px |
| `cover.jpg` | ≥ 1920px wide |

The logo also prints on every invoice, so a low-resolution copy shows up as a soft,
pixelated header on an A4 page. It is worth insisting on the original file.

## Publishing one

These files are not served directly. Upload the asset through Admin → الوسائط, then set
it in Admin → إعدادات المتجر (`logo_url`, `favicon_url`). This directory is the archive
of record so the asset survives a database reset.
