import sx from "../sx.js";
import A from "../utils/A.jsx";

export default function Header({ v }) {
  return (
    <>
      {v.announce && (
        <div style={sx`background:#1F4E4A;color:#EAF1EF;font-size:12.5px;letter-spacing:.01em`}>
          <div style={sx`max-width:1360px;margin:0 auto;padding:0 var(--pad);height:38px;display:flex;align-items:center;justify-content:center;gap:14px;position:relative`}>
            <span style={sx`text-align:center`}>{v.announceText}</span>
            <button type="button" onClick={v.hideAnnounce} aria-label="إغلاق الشريط" className="hv-white" style={sx`position:absolute;inset-inline-start:var(--pad);background:transparent;border:0;color:#9FBDB7;font-size:16px;cursor:pointer;line-height:1`}>✕</button>
          </div>
        </div>
      )}

      <div style={sx`position:sticky;top:0;z-index:60;background:#fff;border-bottom:1px solid #E9E3DA;box-shadow:${v.hdrShadow};transition:box-shadow .25s ease`}>
        <div style={sx`max-width:1360px;margin:0 auto;padding:14px var(--pad);display:flex;align-items:center;gap:18px`}>
          <button type="button" onClick={v.openNav} aria-label="فتح القائمة" aria-expanded={v.navOpen} style={sx`display:var(--mob);width:42px;height:42px;align-items:center;justify-content:center;border:1px solid #E9E3DA;border-radius:10px;background:#fff;color:#1E1B18;cursor:pointer;flex:0 0 auto`}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"></path></svg>
          </button>

          <A href="/" style={sx`display:flex;flex-direction:column;gap:1px;flex:0 0 auto;text-decoration:none`}>
            {v.logoUrl ? (
              <img src={v.logoUrl} alt={v.storeName} style={sx`height:38px;width:auto;object-fit:contain`} />
            ) : (
              <span style={sx`font-family:'Marcellus',serif;font-size:27px;line-height:1;letter-spacing:.14em;color:#1F4E4A`}>{v.storeName}</span>
            )}
            {v.storeTagline && <span style={sx`font-size:10.5px;color:#9C958A;letter-spacing:.06em`}>{v.storeTagline}</span>}
          </A>

          <form onSubmit={v.submitSearch} role="search" style={sx`display:var(--desk);flex:1;max-width:560px;position:relative`}>
            <input type="search" value={v.q} onChange={v.onQ} onFocus={v.focusSearch} aria-label="ابحث في المتجر" placeholder="ابحث عن منتج، قسم، أو رقم SKU…" className="fx-teal" style={sx`width:100%;height:46px;border:1px solid #E1DACE;border-radius:12px;background:#FBF9F6;padding:0 44px 0 108px;font-size:14px;color:#1E1B18;transition:border-color .18s ease,background .18s ease`} />
            <span style={sx`position:absolute;inset-inline-start:15px;top:13px;color:#A39C90;pointer-events:none`}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path></svg>
            </span>
            <button type="submit" className="hv-teal-dark" style={sx`position:absolute;inset-inline-end:6px;top:6px;height:34px;padding:0 18px;border:0;border-radius:9px;background:#1F4E4A;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:background .18s ease`}>بحث</button>
            {v.showSug && (
              <div style={sx`position:absolute;top:54px;inset-inline:0;background:#fff;border:1px solid #E9E3DA;border-radius:14px;box-shadow:0 18px 44px rgba(30,27,24,.14);padding:8px;z-index:70;animation:popIn .18s ease both`}>
                {v.sugCats.map((c) => (
                  <A key={c.slug} href={c.href} onClick={v.closeAllH} className="hv-sand" style={sx`display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;color:#1E1B18;font-size:13.5px`}><span style={sx`font-size:11px;color:#9C958A`}>قسم</span>{c.name}</A>
                ))}
                {v.sugProducts.map((s) => (
                  <A key={s.slug} href={s.href} onClick={v.closeAllH} className="hv-sand" style={sx`display:flex;align-items:center;gap:11px;padding:8px 10px;border-radius:9px;color:#1E1B18`}>
                    <span style={sx`width:42px;height:42px;border-radius:8px;background:${s.bg};flex:0 0 auto`}></span>
                    <span style={sx`display:flex;flex-direction:column;gap:2px;min-width:0`}><span style={sx`font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`}>{s.name}</span><span style={sx`font-size:12.5px;color:#1F4E4A;font-weight:700`}>{s.priceText}</span></span>
                  </A>
                ))}
                {v.sugEmpty && <div style={sx`padding:16px 12px;font-size:13px;color:#7C766D`}>لا توجد نتائج لـ «{v.q}» — جرّب كلمة أعم.</div>}
                {v.showRecent && (
                  <>
                    <div style={sx`padding:8px 10px 4px;font-size:11.5px;color:#9C958A`}>عمليات بحث سابقة</div>
                    {v.recentSearches.map((r) => (
                      <button key={r.text} type="button" onClick={r.run} className="hv-sand" style={sx`display:block;width:100%;text-align:start;padding:8px 10px;border:0;background:transparent;border-radius:9px;font-size:13.5px;color:#4A453E;cursor:pointer`}>↻ {r.text}</button>
                    ))}
                  </>
                )}
              </div>
            )}
          </form>

          {v.phone && (
            <div style={sx`display:var(--wide);align-items:center;gap:10px;flex:0 0 auto;padding-inline-end:4px`}>
              <span style={sx`width:38px;height:38px;border-radius:10px;background:#F1F5F4;color:#1F4E4A;display:flex;align-items:center;justify-content:center`}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 5c0-1 1-2 2-2h2l2 5-2 1c1 3 3 5 6 6l1-2 5 2v2c0 1-1 2-2 2C10 19 5 14 4 5Z"></path></svg>
              </span>
              <span style={sx`display:flex;flex-direction:column;line-height:1.35`}><span style={sx`font-size:13px;font-weight:700`}>{v.phone}</span><span style={sx`font-size:11px;color:#9C958A`}>{v.hours}</span></span>
            </div>
          )}

          <div style={sx`display:flex;align-items:center;gap:8px;margin-inline-start:auto;flex:0 0 auto`}>
            <button type="button" onClick={v.openSearch} aria-label="بحث" style={sx`display:var(--mob);width:42px;height:42px;align-items:center;justify-content:center;border:1px solid #E9E3DA;border-radius:10px;background:#fff;color:#1E1B18;cursor:pointer`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path></svg>
            </button>
            <A href="/contact" className="hv-sand-border" style={sx`display:var(--desk);align-items:center;gap:8px;height:42px;padding:0 14px;border:1px solid #E9E3DA;border-radius:10px;color:#1E1B18;font-size:13px;font-weight:600;transition:border-color .18s ease,background .18s ease`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8" r="3.4"></circle><path d="M5 20c1.2-3.6 4-5.2 7-5.2s5.8 1.6 7 5.2"></path></svg>
              تواصل معنا
            </A>
            <button type="button" onClick={v.openCart} aria-label="عربة التسوّق" className="hv-teal-dark" style={sx`position:relative;display:flex;align-items:center;gap:8px;height:42px;padding:0 14px;border:1px solid #1F4E4A;border-radius:10px;background:#1F4E4A;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:background .18s ease`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h2l2.2 10.4a2 2 0 0 0 2 1.6h6.6a2 2 0 0 0 2-1.55L20.5 8H7"></path><circle cx="10" cy="20" r="1.3"></circle><circle cx="17" cy="20" r="1.3"></circle></svg>
              <span style={sx`display:var(--deskb)`}>{v.cartTotalText}</span>
              <span key={v.bump} style={sx`position:absolute;top:-7px;inset-inline-start:-7px;min-width:21px;height:21px;padding:0 5px;border-radius:11px;background:#C9A24B;color:#1E1B18;font-size:11.5px;font-weight:800;display:flex;align-items:center;justify-content:center;animation:${v.badgeAnim}`}>{v.cartCount}</span>
            </button>
          </div>
        </div>

        <div style={sx`display:var(--nav);border-top:1px solid #F0EBE3;background:#fff`}>
          <div style={sx`max-width:1360px;margin:0 auto;padding:0 var(--pad);display:flex;align-items:center;gap:6px;height:52px`}>
            <button type="button" onClick={v.toggleMega} aria-expanded={v.mega} style={sx`display:flex;align-items:center;gap:9px;height:36px;padding:0 16px;border:0;border-radius:9px;background:${v.megaBg};color:${v.megaColor};font-size:13.5px;font-weight:700;cursor:pointer;transition:background .2s ease`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
              كل الأقسام
            </button>
            {v.navLinks.map((l) => (
              <A key={l.href} href={l.href} className="hv-teal-text" style={sx`position:relative;display:flex;align-items:center;height:52px;padding:0 13px;font-size:13.5px;font-weight:${l.weight};color:${l.color};transition:color .18s ease`}>{l.label}<span style={sx`position:absolute;bottom:0;inset-inline:13px;height:2px;background:#C9A24B;transform:scaleX(${l.active});transform-origin:right;transition:transform .22s cubic-bezier(.22,.61,.36,1)`}></span></A>
            ))}
            {v.hours && <span style={sx`margin-inline-start:auto;display:flex;align-items:center;gap:7px;font-size:12.5px;color:#7C766D`}><span style={sx`color:#C9A24B`}>✦</span>{v.hours}</span>}
          </div>
          {v.mega && (
            <div style={sx`position:absolute;inset-inline:0;background:#fff;border-top:1px solid #F0EBE3;border-bottom:1px solid #E9E3DA;box-shadow:0 24px 48px rgba(30,27,24,.13);animation:popIn .2s cubic-bezier(.22,.61,.36,1) both;z-index:65`}>
              <div style={sx`max-width:1360px;margin:0 auto;padding:22px var(--pad) 26px;display:grid;grid-template-columns:1fr 1fr 1fr 1fr 300px;gap:20px`}>
                {v.megaCats.map((c) => (
                  <div key={c.slug} style={sx`display:flex;flex-direction:column;gap:9px`}>
                    <A href={c.href} onClick={v.closeAllH} className="hv-teal-text" style={sx`font-size:14.5px;font-weight:800;color:#1E1B18;display:flex;align-items:center;gap:8px`}><span style={sx`width:7px;height:7px;border-radius:2px;background:#C9A24B`}></span>{c.name}</A>
                    {c.children.map((ch) => (
                      <A key={ch.label} href={ch.href} onClick={v.closeAllH} className="hv-teal-text" style={sx`font-size:13px;color:#7C766D;padding-inline-start:15px`}>{ch.label}</A>
                    ))}
                  </div>
                ))}
                <A href="/packages" onClick={v.closeAllH} style={sx`grid-row:span 2;border-radius:14px;background:linear-gradient(160deg,#1F4E4A,#2F6F68);color:#fff;padding:22px;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;min-height:220px`}>
                  <span style={sx`font-size:11.5px;letter-spacing:.08em;color:#A9CBC5`}>جاهز للاستخدام</span>
                  <span style={sx`font-size:21px;font-weight:800;line-height:1.4`}>البكجات<br />الكاملة</span>
                  <span style={sx`font-size:13px;color:#D8E7E4`}>كل ما تحتاجه في طلب واحد ←</span>
                </A>
              </div>
            </div>
          )}
        </div>

        <div style={sx`display:var(--mob);gap:8px;padding:0 var(--pad) 12px;overflow-x:auto;scrollbar-width:none`}>
          {v.categories.map((c) => (
            <A key={c.slug} href={c.href} style={sx`flex:0 0 auto;padding:8px 14px;border:1px solid #E9E3DA;border-radius:999px;background:#FBF9F6;font-size:12.5px;font-weight:600;color:#4A453E;white-space:nowrap`}>{c.name}</A>
          ))}
        </div>
      </div>
    </>
  );
}
