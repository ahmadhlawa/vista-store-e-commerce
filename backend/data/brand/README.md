# Seed brand assets

Tracked, version-controlled brand files for Vista Store: logo, favicon, cover art.
Kept separate from `backend/data/vista-uploads/`, which is the runtime media root that
Admin writes into and Git ignores. Mixing the two would put customer-uploaded product
photos into source control and make a brand asset disappear on a fresh clone.

## Current contents

| File | Received | Notes |
| --- | --- | --- |
| `vista-logo.jpeg` | 2026-08-03, from the owner | 1000×1000 JPEG, stored byte for byte |

The logo was supplied directly by the owner and is archived here unaltered — not
redrawn, retraced, recoloured or re-encoded. The same bytes are served as a static
asset from `frontend/public/brand/vista-logo.jpeg`, and the Vista instance's
`StoreSettings.logo_url` points at `/brand/vista-logo.jpeg`.

The header reads `logo_url` and nothing else: with no logo configured it shows the
store name as text, exactly as before. The asset is never a built-in default, so
another client instance built from this template is never branded as Vista.

Its sampled colours are the storefront's brand tokens: primary `#484397`
(deep blue-purple), accent `#FFC50A` (yellow), on white.

Still wanted: a **vector or transparent-background** original, **trimmed**.

Two measured limitations of the file we have:

- It is a JPEG, so it carries a white box rather than transparency — visible against
  any non-white surface, and it is the version that prints on invoices.
- Roughly a third of it is white margin. The artwork occupies only x 19.8–80.4% and
  y 34.6–64.6% of the 1000×1000 canvas. The header sizes logos with `object-fit:
  contain` so no client's mark is ever cropped or stretched, which means this file's
  own padding is rendered too: the mark reads smaller than the space it sits in.
  Trimming the original fixes it with no code change.

Nothing here was taken from a social page, and nothing was generated as a stand-in.

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
