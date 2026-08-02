# Social source audit — Vista Store

**Sources reviewed:** only the two pages supplied by the client. No search was performed
and no similarly named business was consulted.

```
Instagram  https://www.instagram.com/vistastore.ps
Facebook   https://www.facebook.com/people/Vista-Store-%D9%85%D8%AA%D8%AC%D8%B1-%D9%81%D9%8A%D8%B3%D8%AA%D8%A7/61582596333597/
           share link: https://www.facebook.com/share/1D1VqUXHdq/
```

**Reviewed on:** 2026-08-02
**Reviewed by:** automated public page fetch. No account was signed in, no access control
was bypassed, and no bulk collection of either account was performed.

This file supersedes [facebook-source-audit.md](facebook-source-audit.md), which recorded
the Facebook-only attempt made in the previous session. That file is left in place as the
record of what was tried then; its conclusion still holds.

---

## Access result

| Source | Result |
| --- | --- |
| **Instagram** | **Readable.** The public profile served its bio, its story-highlight names and its recent post captions. |
| **Facebook** | **Restricted, unchanged.** The page returns its document title and nothing else — no About block, no posts, no contact panel, no imagery. Facebook serves page bodies only to a signed-in session, and signing in was out of scope. |

Because Facebook stayed unreadable, everything below comes from Instagram, exactly as the
brief requires: continue from the accessible page, invent nothing for the other.

---

## Observed items

Confidence means: **confirmed** — read directly off the page on the review date;
**inferred** — a reasonable reading, not a fact; **unavailable** — not served at all.

| # | Platform | Visible category / product type | Visible name | Visible price | Visual characteristics | Confidence | Used as preview content |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Instagram | Line of business — custom printing and gifts | bio: «متجر مطبوعات وهدايا مخصصة» | — | — | **confirmed** | Yes — shapes the whole category set |
| 2 | Instagram | Wedding invitations | story highlight «مكاتيب الأفراح» | — | — | **confirmed** | Yes — category `wedding-invitations` |
| 3 | Instagram | Printed hoodies | story highlight «بلايز هودي» | — | — | **confirmed** | Yes — category `printed-apparel` |
| 4 | Instagram | Scarves | story highlight «سكارف ميكاسا» | — | — | **confirmed** | Yes — category `scarves`. The brand word was **not** reused in any preview product name |
| 5 | Instagram | Ramadan seasonal goods | story highlight «رمضان 2026» | — | — | **confirmed** | Yes — category `ramadan-occasions` |
| 6 | Instagram | Miscellaneous products | story highlight «منتجات متفرقة» | — | — | **confirmed** | Indirectly — supports a broad catalog |
| 7 | Instagram | Customer feedback highlights | «فيدباك الزباين», «Feedback» | — | — | **confirmed** | No — the store has no reviews feature and none was invented |
| 8 | Instagram | Congratulation banner | post 2026-07-18 | — | stated size **200 × 85 cm** | **confirmed** (size), name preview-only | Yes — `preview-graduation-banner` |
| 9 | Instagram | Foam board | post 2026-07-18 | — | stated size **70 × 100 cm** | **confirmed** (size), name preview-only | Yes — `preview-foam-board` |
| 10 | Instagram | Wooden display stand | post 2026-07-18 | — | — | **confirmed** (type) | Yes — `preview-wooden-stand` |
| 11 | Instagram | Gift cards | post 2026-07-18 | — | — | **confirmed** (type) | Yes — `preview-gift-card-graduation` |
| 12 | Instagram | Graduation / exam-results occasion | post 2026-07-18 caption | — | — | **confirmed** | Yes — category `event-print` |
| 13 | Instagram | Brand colour pairing | bio emoji 💛 / 💜 | — | yellow and purple | **inferred** | Yes — only for the generated placeholder gradients. **Not** written into the store theme |
| 14 | Instagram | City / premises | bio: «الخليل - مجمع زمزم التجاري» | — | — | **confirmed as visible** | **No** — see "Deliberately not used" |
| 15 | Instagram | Contact number | visible in one post | — | — | **confirmed as visible** | **No** — see "Deliberately not used" |
| 16 | Instagram | Linked website in bio | a `vistastore.ps` link | — | — | **confirmed as visible** | **No** — outside the two supplied sources; not opened, not used |
| 17 | Instagram | A price-like fragment in the 2026-07-18 post | — | illegible in the extracted text | — | **unavailable** | **No** — an unreadable price is not a price |
| 18 | Instagram | Post imagery (banners, scarves, hoodies, Eid greetings) | — | — | described only in aggregate | **inferred** | **No image was downloaded** — see below |
| 19 | Instagram | Profile picture / logo | — | — | — | **unavailable** at usable resolution | No |
| 20 | Facebook | Business name (English + Arabic) | «Vista Store», «متجر فيستا» | — | — | **confirmed** | Already in `instance/vista-store.yaml` |
| 21 | Facebook | Everything else — About, category, posts, prices, imagery, contact, hours | — | — | — | **unavailable** — page body not served | No |

---

## Deliberately not used, and why

* **No price is confirmed.** Not one legible price was visible on either page. Every price
  in the preview dataset is invented filler, marked as such in the YAML and in
  [preview-content-manifest.md](preview-content-manifest.md).
* **Address and phone number were seen but not used.** They appear on the public profile,
  but the brief forbids inferring owner contact details, and a number transcribed from a
  social post is not the same thing as the number the owner wants customers to call.
  Both stay blank in `instance/vista-store.yaml` and remain on
  [data-needed-from-owner.md](data-needed-from-owner.md), to be filled from what the owner
  actually sends. The digits are deliberately not repeated in this repository.
* **No image was downloaded.** Instagram's CDN URLs are short-lived and signed; storing one
  as a product image would leave a broken picture within days, and harvesting the feed was
  out of scope. The preview catalog therefore uses the project's own generated placeholder
  gradients — see "Missing assets" below.
* **The «ميكاسا» brand word was not reused** in any preview product name. It identifies a
  third party's product line, and inventing prices under someone else's brand would be
  worse than inventing them under none.
* **Nothing was inferred** about legal or company details, tax registration, delivery areas
  or fees, currency, inventory, warranty, specifications or policy text. Where a value is
  unknown, the field is empty.
* **No substitute business.** Other companies trade as "Vista Store". None was opened.

---

## Missing assets — still needed from the owner

| Asset | Status |
| --- | --- |
| Logo, at print resolution | **Missing.** The storefront shows the store name as text. |
| Cover / hero photography | **Missing.** Hero slides use generated gradients. |
| Real product photography | **Missing.** Every preview product uses a generated gradient tile. |
| Brand colours | **Missing as a specification.** The yellow/purple pairing was inferred from bio emoji and used only for placeholder gradients; the store theme still carries the template's neutral defaults. |

---

## What changed in `instance/vista-store.yaml`

One field, and only because it is now confirmed from a page the client supplied:

* `contact.instagram_url` — set to the reviewed profile URL.

Everything else in that file is unchanged. Store name and Facebook URL were already
confirmed; every other field remains deliberately empty.

## Re-running this audit

Re-run it when the owner grants Facebook access or sends material directly, and keep the
same table shape: platform, source URL, visible type, visible name, visible price, visual
characteristics, confidence, and whether it is used. Original photography should be
requested from the owner rather than harvested — both platforms re-encode and downscale
what they serve.

---

## Enrichment audit update — 2026-08-02

| Platform | Exact source | Date | Visibly available | Image decision | Confidence | Intended preview usage |
| --- | --- | --- | --- | --- | --- | --- |
| Facebook | `https://www.facebook.com/people/Vista-Store-%D9%85%D8%AC%D8%B1-%D9%81%D9%8A%D8%B3%D8%AA%D8%A7/61582596333597/` | unavailable | Login wall; no post, image, price, specification, or contact panel was available. | Rejected — nothing retrievable. | unavailable | None. |
| Instagram | `https://www.instagram.com/vistastore.ps` | 2026-08-02 | Bio: custom printing and personalized gifts. | Rejected — no stable public original available for import. | confirmed | Gifts and miscellaneous custom products. |
| Instagram | `https://www.instagram.com/vistastore.ps` | 2026-08-02 | Highlights: wedding invitations, printed hoodies, scarves, Ramadan 2026, miscellaneous products. | Rejected — no stable public original available for import. | confirmed | Eight category lines and inferred preview products. |
| Instagram | `https://www.instagram.com/vistastore.ps` | 2026-07-18 visible post | Graduation occasion: banner 200 × 85 cm, foam board 70 × 100 cm, wooden stand, gift cards; no legible price. | Rejected — no stable public original available for import. | confirmed for types and dimensions | Event-print products; only the two dimensions are retained as specifications. |

No social CDN URL or downloaded social image is stored in the database. The preview batch
now generates 25 owned, deterministic Vista preview artworks; they are not photographs and
remain restorable and removable through the existing storage and preview lifecycle.
