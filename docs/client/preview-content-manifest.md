# Preview content manifest — Vista Store

**What this document is for:** to make it impossible to mistake demonstration content for
the client's catalog. Every row the preview import creates is listed here with its
provenance.

**Dataset:** `instance/preview/vista-social-preview.yaml`
**Batch key:** `vista-social-preview`
**Media prefix:** `vista-store/preview/`
**Source audit:** [social-source-audit.md](social-source-audit.md)

---

## The one-line summary

**Nothing in the preview catalog is Vista Store's real product data.** Eight product
*lines* are confirmed from the client's own public Instagram profile. Every product
*name*, every *price*, every *stock number* and every *description* was written for this
demonstration. No price on either social page was legible, so no price could be copied
even in principle.

---

## What the batch creates

| Type | Count |
| --- | --- |
| Categories | 8 |
| Products | 35 (30 standard + 5 packages) |
| Products on offer (`compare_at_price` set) | 9 |
| Featured / new / bestseller flags | 12 / 9 / 10 |
| Hero slides | 4 |
| Banners | 3 |
| Home sections added | 3 (seven populated section types with the four instance sections) |
| Delivery areas | 1 |
| Coupons | 1 |
| Media objects | 25 |
| **Owned rows recorded in the batch** | **80** |

---

## Confirmed social content

Read directly from `https://www.instagram.com/vistastore.ps` on 2026-08-02. These are the
only facts the preview is built on.

| Confirmed observation | How the preview uses it |
| --- | --- |
| Line of business: custom printing and gifts | The shape of the whole catalog |
| Story highlight — wedding invitations | Category `wedding-invitations` |
| Story highlight — printed hoodies | Category `printed-apparel` |
| Story highlight — scarves | Category `scarves` (the third-party brand word is not reused) |
| Story highlight — Ramadan 2026 | Category `ramadan-occasions` |
| Post 2026-07-18 — graduation printing | Category `event-print`, and category `signage-stands` |
| Post 2026-07-18 — banner 200 × 85 cm | The size on `preview-graduation-banner`, kept as a product specification |
| Post 2026-07-18 — foam board 70 × 100 cm | The size on `preview-foam-board`, kept as a product specification |
| Post 2026-07-18 — wooden stands, gift cards | `preview-wooden-stand`, `preview-gift-card-graduation` |

The two confirmed sizes are the only *values* anywhere in the dataset taken from a Vista
Store page.

## Inferred preview content

Everything below exists so the storefront is worth looking at. It is `origin: inferred` in
the YAML, and each entry carries a `source_note` naming the visible thing it was built
from.

* **All 35 product names.** Written for this dataset. None was quoted from a post.
* **All 35 prices, and all 9 `compare_at_price` values.** Invented. They are not a
  quotation, a range, an estimate, or anything the owner has said.
* **All stock quantities.** Invented; they exist so "in stock / low stock" states render.
* **All descriptions and short descriptions.** Written for this dataset.
* **The five packages** (`preview-package-graduation`, `preview-package-wedding`,
  `preview-package-wedding-welcome`, `preview-package-eid`, `preview-package-gift`). Assembled
  from confirmed product types, but the bundles themselves are invented.
* **The four hero slides and their copy.**
* **The yellow/purple placeholder palette,** inferred from the bio's 💛/💜 emoji. Used only
  for generated images; the store theme is untouched.

## Generic preview placeholders

Owned by this project, not by Vista Store, and not pretending to be photographs.

* **25 distinct Vista preview artworks**, produced by `app/services/placeholder_image.py`, uploaded through
  the configured storage provider under `vista-store/preview/`.
* **The delivery area `منطقة تجريبية للمعاينة`,** priced at **0.00** with no estimate. It
  exists only because checkout cannot complete without one. Its zero fee is a deliberate
  refusal to guess a real delivery rate.
* **The coupon `PREVIEW10`,** so the discount path can be demonstrated. Not a promotion the
  owner has offered.
* **The two banners,** whose subtitles say in Arabic that the prices are for preview.

## Missing owner data — the preview does not fill these

Still blank, still needed. Sending this list is the next real step; see
[data-needed-from-owner.md](data-needed-from-owner.md).

| Missing | Consequence today |
| --- | --- |
| Real product names, prices and stock | The catalog is entirely demonstration content |
| Product photography | Every product shows a gradient tile |
| Logo and cover imagery | The header shows the store name as text |
| Brand colours | The theme is the template's neutral default |
| Phone, WhatsApp, address, working hours | Contact rows are hidden rather than faked |
| Real delivery areas and fees | Only the zero-priced preview area exists |
| Currency confirmation | `ILS` / `₪` is carried over unverified, and must be settled **before the first real order** — an issued invoice cannot be corrected in place |
| Tax, registration and legal business details | Absent from invoices |
| Policy text (returns, shipping, terms, privacy) | The static pages exist and are empty |

---

## Removing the preview

Dry run first — it lists exactly what would go, and writes nothing:

```
cd backend
.venv\Scripts\python.exe -m scripts.preview_cli purge --dataset ../instance/preview/vista-social-preview.yaml
```

Then apply:

```
.venv\Scripts\python.exe -m scripts.preview_cli purge --dataset ../instance/preview/vista-social-preview.yaml --confirm
```

`--dataset` may be omitted; it defaults to the Vista dataset above. The installed console
script is `vista-preview`, so `vista-preview purge --confirm` is equivalent.

What purge will **not** do, by design:

* It never deletes a row it did not create. Ownership is proven by `import_batch_records`,
  not guessed by slug.
* It skips any preview row the owner has since edited in Admin, and names it. Add `--force`
  to delete those too.
* It refuses — with or without `--force` — to delete a product that appears on an order, or
  a delivery area an order used. Orders and invoices are the permanent record.
* It refuses to delete a preview category that still holds products from outside the batch.
* It deletes stored image objects only inside `vista-store/preview/`.

Verify with `vista-preview status` before and after.

## Replacing the preview with real data later

1. `vista-preview purge --confirm` — the store is then empty, not half-preview.
2. Load the owner's real catalog through Admin, or through a client-specific import.
3. Fill `instance/vista-store.yaml` from what the owner sent and re-run
   `scripts.instance_cli apply`.
4. Remove `VITE_PREVIEW_NOTICE` from `frontend/.env` and rebuild, so the preview banner
   disappears.

Steps 1 and 4 are what make this dataset safe to show a client: it leaves nothing behind.
