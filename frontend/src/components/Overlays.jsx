import sx from "../sx.js";

export default function Overlays({ v }) {
  return (
    <>
      {v.anyOverlay && (
        <div onClick={v.closeAll} style={sx`position:fixed;inset:0;background:rgba(26,24,21,.45);z-index:80;animation:fadeIn .2s ease both;backdrop-filter:blur(2px)`}></div>
      )}

      {v.cartOpen && (
        <aside role="dialog" aria-modal="true" aria-label="عربة التسوّق" style={sx`position:fixed;inset-block:0;inset-inline-start:0;width:min(420px,92vw);background:#FBF9F6;z-index:90;display:flex;flex-direction:column;animation:slideIn .28s cubic-bezier(.22,.61,.36,1) both;box-shadow:0 0 50px rgba(26,24,21,.25)`}>
          <div style={sx`display:flex;align-items:center;justify-content:space-between;padding:18px 20px;background:#fff;border-bottom:1px solid #E9E3DA`}>
            <strong style={sx`font-size:16px`}>عربة التسوّق ({v.cartCount})</strong>
            <button type="button" onClick={v.closeAll} aria-label="إغلاق" style={sx`width:38px;height:38px;border:1px solid #E9E3DA;border-radius:10px;background:#fff;cursor:pointer;font-size:15px;color:#4A453E`}>✕</button>
          </div>
          {v.cartEmpty && (
            <div style={sx`flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:30px;text-align:center`}>
              <span style={sx`width:66px;height:66px;border-radius:50%;background:#F4F1EC;display:flex;align-items:center;justify-content:center;font-size:26px;color:#A39C90`}>☹</span>
              <strong style={sx`font-size:17px`}>لا توجد منتجات بعد</strong>
              <p style={sx`margin:0;font-size:13.5px;color:#7C766D`}>أضف منتجات لتظهر هنا.</p>
              <a href="#/shop" onClick={v.closeAllH} style={sx`height:46px;display:flex;align-items:center;padding:0 24px;border-radius:11px;background:#1F4E4A;color:#fff;font-weight:800;font-size:14px`}>تصفّح المتجر</a>
            </div>
          )}
          {v.cartHasItems && (
            <>
              <div style={sx`flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px`}>
                {v.cartRows.map((i) => (
                  <div key={i.key} style={sx`display:flex;gap:11px;background:#fff;border:1px solid #E9E3DA;border-radius:12px;padding:11px`}>
                    <span style={sx`width:66px;height:66px;border-radius:9px;background:${i.bg};flex:0 0 auto`}></span>
                    <div style={sx`display:flex;flex-direction:column;gap:5px;flex:1;min-width:0`}>
                      <a href={i.href} onClick={v.closeAllH} style={sx`font-size:13.5px;font-weight:700;color:#1E1B18;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden`}>{i.name}</a>
                      <div style={sx`display:flex;align-items:center;gap:8px`}>
                        <div style={sx`display:flex;align-items:center;border:1px solid #E1DACE;border-radius:8px;height:32px`}>
                          <button type="button" onClick={i.dec} aria-label="إنقاص" style={sx`width:30px;height:100%;border:0;background:transparent;cursor:pointer;font-size:15px;color:#4A453E`}>−</button>
                          <span style={sx`width:26px;text-align:center;font-size:13px;font-weight:800`}>{i.qty}</span>
                          <button type="button" onClick={i.inc} aria-label="زيادة" style={sx`width:30px;height:100%;border:0;background:transparent;cursor:pointer;font-size:15px;color:#4A453E`}>+</button>
                        </div>
                        <strong style={sx`font-size:14px;color:#1F4E4A;margin-inline-start:auto`}>{i.lineText}</strong>
                        <button type="button" onClick={i.remove} aria-label="إزالة" className="hv-red-text" style={sx`border:0;background:transparent;color:#A39C90;cursor:pointer;font-size:14px`}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={sx`background:#fff;border-top:1px solid #E9E3DA;padding:16px 18px;display:flex;flex-direction:column;gap:10px`}>
                <div style={sx`display:flex;justify-content:space-between;font-size:14px`}><span style={sx`color:#7C766D`}>المجموع الفرعي</span><strong>{v.subtotalText}</strong></div>
                <span style={sx`font-size:12px;color:#9C958A`}>{v.freeShipHint}</span>
                <a href="#/checkout" onClick={v.closeAllH} style={sx`height:50px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:#1F4E4A;color:#fff;font-size:15px;font-weight:800`}>إتمام الطلب</a>
                <a href="#/cart" onClick={v.closeAllH} style={sx`height:46px;display:flex;align-items:center;justify-content:center;border-radius:11px;border:1px solid #E1DACE;color:#1E1B18;font-size:14px;font-weight:700`}>عرض العربة</a>
              </div>
            </>
          )}
        </aside>
      )}

      {v.navOpen && (
        <nav role="dialog" aria-modal="true" aria-label="القائمة" style={sx`position:fixed;inset-block:0;inset-inline-end:0;width:min(340px,88vw);background:#fff;z-index:90;display:flex;flex-direction:column;animation:slideIn .28s cubic-bezier(.22,.61,.36,1) both;box-shadow:0 0 50px rgba(26,24,21,.25)`}>
          <div style={sx`display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #E9E3DA`}>
            <span style={sx`font-family:'Marcellus',serif;font-size:22px;letter-spacing:.14em;color:#1F4E4A`}>TEST</span>
            <button type="button" onClick={v.closeAll} aria-label="إغلاق القائمة" style={sx`width:38px;height:38px;border:1px solid #E9E3DA;border-radius:10px;background:#fff;cursor:pointer;font-size:15px`}>✕</button>
          </div>
          <div style={sx`flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:4px`}>
            <span style={sx`font-size:11.5px;color:#9C958A;padding:8px 8px 4px;letter-spacing:.06em`}>الأقسام</span>
            {v.categories.map((c) => (
              <div key={c.slug} style={sx`display:flex;flex-direction:column;border-bottom:1px solid #F5F1EA`}>
                <div style={sx`display:flex;align-items:center`}>
                  <a href={c.href} onClick={v.closeAllH} style={sx`flex:1;padding:14px 8px;font-size:14.5px;font-weight:700;color:#1E1B18`}>{c.name}</a>
                  <button type="button" onClick={c.expand} aria-label="عرض الأقسام الفرعية" aria-expanded={c.open} style={sx`width:40px;height:40px;border:0;background:transparent;color:#7C766D;font-size:14px;cursor:pointer;transform:rotate(${c.rotate});transition:transform .2s ease`}>▾</button>
                </div>
                {c.open && (
                  <div style={sx`display:flex;flex-direction:column;padding:0 8px 10px;gap:2px;animation:fadeIn .2s ease both`}>
                    {c.children.map((ch) => (
                      <a key={ch.label} href={ch.href} onClick={v.closeAllH} className="hv-sand" style={sx`padding:9px 12px;font-size:13.5px;color:#7C766D;border-radius:8px`}>{ch.label}</a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <span style={sx`font-size:11.5px;color:#9C958A;padding:14px 8px 4px;letter-spacing:.06em`}>روابط</span>
            {v.navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={v.closeAllH} style={sx`padding:12px 8px;font-size:14px;color:#4A453E;border-bottom:1px solid #F5F1EA`}>{l.label}</a>
            ))}
          </div>
          <div style={sx`border-top:1px solid #E9E3DA;padding:14px 16px;display:flex;flex-direction:column;gap:9px`}>
            <a href="#/account" onClick={v.closeAllH} style={sx`height:46px;display:flex;align-items:center;justify-content:center;border-radius:11px;border:1px solid #E1DACE;color:#1E1B18;font-size:14px;font-weight:700`}>حسابي</a>
            <a href={v.waHref} target="_blank" rel="noopener" style={sx`height:46px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:#2E7D5B;color:#fff;font-size:14px;font-weight:800`}>تواصل عبر واتساب</a>
          </div>
        </nav>
      )}

      {v.searchOpen && (
        <div role="dialog" aria-modal="true" aria-label="البحث" style={sx`position:fixed;top:0;inset-inline:0;background:#fff;z-index:90;padding:16px;box-shadow:0 12px 40px rgba(26,24,21,.18);animation:popIn .2s ease both`}>
          <form onSubmit={v.submitSearch} style={sx`display:flex;gap:9px`}>
            <input type="search" value={v.q} onChange={v.onQ} ref={v.searchRef} placeholder="ابحث عن منتج أو قسم…" aria-label="ابحث" style={sx`flex:1;height:50px;border:1px solid #E1DACE;border-radius:11px;background:#FBF9F6;padding:0 14px;font-size:14.5px`} />
            <button type="submit" style={sx`height:50px;padding:0 18px;border:0;border-radius:11px;background:#1F4E4A;color:#fff;font-weight:800;font-size:14px;cursor:pointer`}>بحث</button>
            <button type="button" onClick={v.closeAll} aria-label="إغلاق" style={sx`width:50px;height:50px;border:1px solid #E9E3DA;border-radius:11px;background:#fff;cursor:pointer;font-size:15px`}>✕</button>
          </form>
          <div style={sx`max-height:60vh;overflow-y:auto;margin-top:10px`}>
            {v.sugProducts.map((s) => (
              <a key={s.slug} href={s.href} onClick={v.closeAllH} className="hv-sand" style={sx`display:flex;align-items:center;gap:11px;padding:9px;border-radius:10px;color:#1E1B18`}>
                <span style={sx`width:46px;height:46px;border-radius:9px;background:${s.bg};flex:0 0 auto`}></span>
                <span style={sx`display:flex;flex-direction:column;gap:2px;min-width:0`}><span style={sx`font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`}>{s.name}</span><span style={sx`font-size:13px;color:#1F4E4A;font-weight:700`}>{s.priceText}</span></span>
              </a>
            ))}
            {v.sugEmpty && <p style={sx`margin:14px 8px;font-size:13.5px;color:#7C766D`}>لا توجد نتائج لـ «{v.q}».</p>}
          </div>
        </div>
      )}

      {v.filtersOpen && (
        <aside role="dialog" aria-modal="true" aria-label="تصفية النتائج" style={sx`position:fixed;inset-block:0;inset-inline-end:0;width:min(340px,90vw);background:#fff;z-index:90;display:flex;flex-direction:column;animation:slideIn .28s cubic-bezier(.22,.61,.36,1) both`}>
          <div style={sx`display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #E9E3DA`}><strong style={sx`font-size:16px`}>تصفية النتائج</strong><button type="button" onClick={v.closeAll} aria-label="إغلاق" style={sx`width:38px;height:38px;border:1px solid #E9E3DA;border-radius:10px;background:#fff;cursor:pointer`}>✕</button></div>
          <div style={sx`flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:16px`}>
            <div style={sx`display:flex;flex-direction:column;gap:10px`}>
              <span style={sx`font-size:13px;font-weight:800`}>الأقسام</span>
              {v.filterCats.map((c) => (
                <label key={c.name} style={sx`display:flex;align-items:center;gap:10px;font-size:14px;color:#4A453E;cursor:pointer;padding:4px 0`}><input type="checkbox" checked={c.checked} onChange={c.toggle} style={sx`width:18px;height:18px;accent-color:#1F4E4A`} />{c.name}</label>
              ))}
            </div>
            <div style={sx`border-top:1px solid #F0EBE3;padding-top:14px;display:flex;flex-direction:column;gap:10px`}>
              <span style={sx`font-size:13px;font-weight:800`}>السعر الأقصى — {v.fMaxText}</span>
              <input type="range" min="30" max="400" step="10" value={v.fMax} onChange={v.onMax} style={sx`width:100%;accent-color:#1F4E4A`} />
            </div>
            <div style={sx`border-top:1px solid #F0EBE3;padding-top:14px;display:flex;flex-direction:column;gap:12px`}>
              <label style={sx`display:flex;align-items:center;gap:10px;font-size:14px;color:#4A453E;cursor:pointer`}><input type="checkbox" checked={v.fOffers} onChange={v.toggleOffers} style={sx`width:18px;height:18px;accent-color:#1F4E4A`} />المخفّضة فقط</label>
              <label style={sx`display:flex;align-items:center;gap:10px;font-size:14px;color:#4A453E;cursor:pointer`}><input type="checkbox" checked={v.fStock} onChange={v.toggleStock} style={sx`width:18px;height:18px;accent-color:#1F4E4A`} />المتوفر فقط</label>
            </div>
          </div>
          <div style={sx`border-top:1px solid #E9E3DA;padding:14px 16px;display:flex;gap:10px`}>
            <button type="button" onClick={v.resetFilters} style={sx`flex:0 0 auto;height:48px;padding:0 16px;border:1px solid #E1DACE;border-radius:11px;background:#fff;font-size:14px;font-weight:700;cursor:pointer`}>إعادة تعيين</button>
            <button type="button" onClick={v.closeAll} style={sx`flex:1;height:48px;border:0;border-radius:11px;background:#1F4E4A;color:#fff;font-size:14.5px;font-weight:800;cursor:pointer`}>عرض {v.resultNum} منتج</button>
          </div>
        </aside>
      )}

      {v.quickOpen && (
        <div role="dialog" aria-modal="true" aria-label="نظرة سريعة" style={sx`position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:18px;pointer-events:none`}>
          <div style={sx`pointer-events:auto;width:min(880px,100%);max-height:88vh;overflow-y:auto;background:#fff;border-radius:18px;animation:popIn .24s cubic-bezier(.22,.61,.36,1) both;box-shadow:0 30px 70px rgba(26,24,21,.3)`}>
            <div style={sx`display:flex;justify-content:flex-end;padding:12px 12px 0`}><button type="button" onClick={v.closeAll} aria-label="إغلاق" style={sx`width:38px;height:38px;border:1px solid #E9E3DA;border-radius:10px;background:#fff;cursor:pointer;font-size:15px`}>✕</button></div>
            <div style={sx`display:grid;grid-template-columns:var(--pdp);gap:24px;padding:6px 26px 28px`}>
              <div style={sx`aspect-ratio:1 / 1;border-radius:14px;background:${v.quick.bg}`}></div>
              <div style={sx`display:flex;flex-direction:column;gap:13px`}>
                <span style={sx`font-size:12px;color:#9C958A`}>{v.quick.categoryName}</span>
                <h2 style={sx`margin:0;font-size:21px;font-weight:800;line-height:1.5`}>{v.quick.name}</h2>
                <div style={sx`display:flex;align-items:center;gap:8px;font-size:13px;color:#7C766D`}><span style={sx`color:#C9A24B`}>★</span><strong style={sx`color:#1E1B18`}>{v.quick.ratingText}</strong><span>{v.quick.reviewsText}</span></div>
                <div style={sx`display:flex;align-items:baseline;gap:10px`}><span style={sx`font-size:26px;font-weight:800;color:#1F4E4A`}>{v.quick.priceText}</span>{v.quick.hasSale && <span style={sx`font-size:15px;color:#A39C90;text-decoration:line-through`}>{v.quick.oldText}</span>}</div>
                <p style={sx`margin:0;font-size:14px;line-height:1.9;color:#4A453E`}>{v.quick.short}</p>
                <div style={sx`display:flex;gap:10px;flex-wrap:wrap;margin-top:4px`}>
                  <div style={sx`display:flex;align-items:center;border:1px solid #E1DACE;border-radius:11px;height:50px`}>
                    <button type="button" onClick={v.qQtyDown} aria-label="إنقاص" style={sx`width:44px;height:100%;border:0;background:transparent;font-size:18px;cursor:pointer;color:#4A453E`}>−</button>
                    <span style={sx`width:40px;text-align:center;font-weight:800`}>{v.qQty}</span>
                    <button type="button" onClick={v.qQtyUp} aria-label="زيادة" style={sx`width:44px;height:100%;border:0;background:transparent;font-size:18px;cursor:pointer;color:#4A453E`}>+</button>
                  </div>
                  <button type="button" onClick={v.addFromQuick} style={sx`flex:1;min-width:170px;height:50px;border:0;border-radius:11px;background:#1F4E4A;color:#fff;font-size:14.5px;font-weight:800;cursor:pointer`}>أضف إلى العربة</button>
                </div>
                <a href={v.quick.href} onClick={v.closeAllH} style={sx`font-size:13.5px;font-weight:700;margin-top:4px`}>عرض التفاصيل الكاملة ←</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {v.toast && (
        <div role="status" aria-live="polite" style={sx`position:fixed;bottom:22px;inset-inline-start:22px;z-index:95;background:#1E1B18;color:#fff;padding:14px 18px;border-radius:12px;display:flex;align-items:center;gap:12px;box-shadow:0 16px 40px rgba(26,24,21,.3);animation:toastIn .25s cubic-bezier(.22,.61,.36,1) both;max-width:min(360px,90vw)`}>
          <span style={sx`width:24px;height:24px;border-radius:50%;background:#2E7D5B;display:flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 auto`}>✓</span>
          <span style={sx`font-size:13.5px;line-height:1.6`}>{v.toast}</span>
          <button type="button" onClick={v.openCart} style={sx`margin-inline-start:auto;border:0;background:transparent;color:#C9A24B;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap`}>عرض العربة</button>
        </div>
      )}

      <a href={v.waHref} target="_blank" rel="noopener" aria-label="تواصل عبر واتساب" className="hv-lift3" style={sx`position:fixed;bottom:22px;inset-inline-end:22px;z-index:70;width:54px;height:54px;border-radius:50%;background:#2E7D5B;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px rgba(46,125,91,.35);transition:transform .2s ease`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.5-.6a11 11 0 0 1-4.2-4.3c-.4-.7-.7-1.4-.7-2 0-.7.3-1.3.6-1.6.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.7 1.7c.1.2 0 .4-.1.5l-.3.4c-.1.2-.3.3-.1.6.4.7.9 1.3 1.5 1.8.6.5 1.1.7 1.4.8.2.1.4.1.6-.1l.7-.8c.2-.2.3-.2.6-.1l1.6.8c.3.1.5.2.5.4.1.1.1.5-.1 1Z"></path></svg>
      </a>
    </>
  );
}
