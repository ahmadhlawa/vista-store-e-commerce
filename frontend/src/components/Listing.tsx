import sx from "../sx";
import type App from "../App";
type View = ReturnType<App["renderVals"]>;
import ProductCard from "./ProductCard";

export default function ListingPage({ v }: { v: View }) {
  return (
    <>
      <section style={sx`background:#fff;border-bottom:1px solid #E9E3DA`}>
        <div style={sx`max-width:1360px;margin:0 auto;padding:22px var(--pad) 26px`}>
          <nav aria-label="مسار التصفح" style={sx`display:flex;align-items:center;gap:8px;font-size:12.5px;color:#9C958A;margin-bottom:10px`}><a href="#/" style={sx`color:#7C766D`}>الرئيسية</a><span>›</span><span style={sx`color:#1E1B18;font-weight:600`}>{v.listTitle}</span></nav>
          <h1 style={sx`margin:0 0 6px;font-size:var(--h1);font-weight:800`}>{v.listTitle}</h1>
          <p style={sx`margin:0;font-size:14px;color:#7C766D`}>{v.listSubtitle}</p>
        </div>
      </section>
      <section style={sx`max-width:1360px;margin:0 auto;padding:24px var(--pad) 60px;display:grid;grid-template-columns:var(--shop);gap:26px;align-items:start`}>
        <aside style={sx`display:var(--deskb);position:sticky;top:150px;background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:18px`}>
          <div style={sx`display:flex;align-items:center;justify-content:space-between;margin-bottom:14px`}><h2 style={sx`margin:0;font-size:15px;font-weight:800`}>تصفية النتائج</h2><button type="button" onClick={v.resetFilters} style={sx`border:0;background:transparent;color:#C0392B;font-size:12.5px;cursor:pointer;font-weight:600`}>إعادة تعيين</button></div>
          <div style={sx`border-top:1px solid #F0EBE3;padding-top:14px;display:flex;flex-direction:column;gap:10px`}>
            <span style={sx`font-size:13px;font-weight:700`}>الأقسام</span>
            {v.filterCats.map((c) => (
              <label key={c.name} style={sx`display:flex;align-items:center;gap:9px;font-size:13px;color:#4A453E;cursor:pointer`}><input type="checkbox" checked={c.checked} onChange={c.toggle} style={sx`width:16px;height:16px;accent-color:#1F4E4A;cursor:pointer`} />{c.name}<span style={sx`margin-inline-start:auto;font-size:11.5px;color:#A39C90`}>{c.count}</span></label>
            ))}
          </div>
          <div style={sx`border-top:1px solid #F0EBE3;margin-top:16px;padding-top:14px;display:flex;flex-direction:column;gap:10px`}>
            <span style={sx`font-size:13px;font-weight:700`}>السعر الأقصى</span>
            <input type="range" min="30" max="400" step="10" value={v.fMax} onChange={v.onMax} aria-label="السعر الأقصى" style={sx`width:100%;accent-color:#1F4E4A;cursor:pointer`} />
            <span style={sx`font-size:12.5px;color:#7C766D`}>حتى <strong style={sx`color:#1F4E4A`}>{v.fMaxText}</strong></span>
          </div>
          <div style={sx`border-top:1px solid #F0EBE3;margin-top:16px;padding-top:14px;display:flex;flex-direction:column;gap:10px`}>
            <span style={sx`font-size:13px;font-weight:700`}>التوفّر والعروض</span>
            <label style={sx`display:flex;align-items:center;gap:9px;font-size:13px;color:#4A453E;cursor:pointer`}><input type="checkbox" checked={v.fOffers} onChange={v.toggleOffers} style={sx`width:16px;height:16px;accent-color:#1F4E4A;cursor:pointer`} />المنتجات المخفّضة فقط</label>
            <label style={sx`display:flex;align-items:center;gap:9px;font-size:13px;color:#4A453E;cursor:pointer`}><input type="checkbox" checked={v.fStock} onChange={v.toggleStock} style={sx`width:16px;height:16px;accent-color:#1F4E4A;cursor:pointer`} />المتوفر في المخزون فقط</label>
          </div>
        </aside>

        <div style={sx`display:flex;flex-direction:column;gap:18px;min-width:0`}>
          <div style={sx`display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid #E9E3DA;border-radius:12px;padding:12px 14px`}>
            <button type="button" onClick={v.openFilters} style={sx`display:var(--mob);align-items:center;gap:8px;height:40px;padding:0 16px;border:1px solid #E1DACE;border-radius:10px;background:#fff;font-size:13px;font-weight:700;cursor:pointer`}>⚙ التصفية</button>
            <span style={sx`font-size:13px;color:#7C766D`}>{v.resultCount}</span>
            <label style={sx`margin-inline-start:auto;display:flex;align-items:center;gap:9px;font-size:13px;color:#7C766D`}>ترتيب حسب
              <select value={v.sort} onChange={v.onSort} style={sx`height:40px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 12px;font-size:13px;color:#1E1B18;cursor:pointer`}>
                <option value="featured">المميّزة أولاً</option>
                <option value="newest">الأحدث</option>
                <option value="price-asc">السعر: الأقل أولاً</option>
                <option value="price-desc">السعر: الأعلى أولاً</option>
                <option value="rating">الأعلى تقييماً</option>
              </select>
            </label>
          </div>

          {v.listLoading && (
            <div style={sx`display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:18px`}>
              {v.skeletons.map((s) => (
                <div key={s.i} style={sx`border:1px solid #E9E3DA;border-radius:14px;background:#fff;overflow:hidden`}>
                  <div style={sx`aspect-ratio:1 / 1;background:linear-gradient(90deg,#F1EDE7 8%,#E7E1D8 18%,#F1EDE7 33%);background-size:800px 100%;animation:shimmer 1.3s linear infinite`}></div>
                  <div style={sx`padding:14px;display:flex;flex-direction:column;gap:9px`}><div style={sx`height:11px;width:40%;border-radius:4px;background:#F1EDE7`}></div><div style={sx`height:13px;width:88%;border-radius:4px;background:#F1EDE7`}></div><div style={sx`height:13px;width:60%;border-radius:4px;background:#F1EDE7`}></div><div style={sx`height:38px;border-radius:9px;background:#F4F1EC;margin-top:6px`}></div></div>
                </div>
              ))}
            </div>
          )}

          {v.listEmpty && (
            <div style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:60px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px`}>
              <span style={sx`width:64px;height:64px;border-radius:50%;background:#F4F1EC;display:flex;align-items:center;justify-content:center;font-size:26px;color:#A39C90`}>⌕</span>
              <h3 style={sx`margin:6px 0 0;font-size:18px;font-weight:800`}>لا توجد منتجات مطابقة</h3>
              <p style={sx`margin:0;font-size:14px;color:#7C766D;max-width:380px`}>جرّب توسيع نطاق السعر أو إلغاء بعض عوامل التصفية.</p>
              <button type="button" onClick={v.resetFilters} style={sx`margin-top:8px;height:44px;padding:0 22px;border:0;border-radius:10px;background:#1F4E4A;color:#fff;font-size:14px;font-weight:700;cursor:pointer`}>إعادة تعيين التصفية</button>
            </div>
          )}

          <div style={sx`display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:18px`}>
            {v.listItems.map((item) => <ProductCard key={item.id} p={item} />)}
          </div>

          {v.hasMore && (
            <button type="button" onClick={v.loadMore} className="hv-fill-teal" style={sx`align-self:center;margin-top:8px;height:48px;padding:0 34px;border:1px solid #1F4E4A;border-radius:12px;background:#fff;color:#1F4E4A;font-size:14px;font-weight:800;cursor:pointer;transition:background .2s ease,color .2s ease`}>عرض المزيد ({v.remainingCount})</button>
          )}
        </div>
      </section>
    </>
  );
}
