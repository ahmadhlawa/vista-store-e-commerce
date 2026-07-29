import sx from "../sx.js";
import ProductCard from "./ProductCard.jsx";

export function ProductPage({ v }) {
  const pd = v.pd;
  return (
    <>
      <section style={sx`max-width:1360px;margin:0 auto;padding:18px var(--pad) 0`}>
        <nav aria-label="مسار التصفح" style={sx`display:flex;align-items:center;gap:8px;font-size:12.5px;color:#9C958A;flex-wrap:wrap`}><a href="#/" style={sx`color:#7C766D`}>الرئيسية</a><span>›</span><a href={pd.catHref} style={sx`color:#7C766D`}>{pd.categoryName}</a><span>›</span><span style={sx`color:#1E1B18;font-weight:600`}>{pd.name}</span></nav>
      </section>
      <section style={sx`max-width:1360px;margin:0 auto;padding:20px var(--pad) 0;display:grid;grid-template-columns:var(--pdp);gap:34px;align-items:start`}>
        <div style={sx`display:flex;flex-direction:column;gap:12px;position:sticky;top:150px`}>
          <div style={sx`aspect-ratio:1 / 1;border-radius:16px;overflow:hidden;border:1px solid #E9E3DA;background:${pd.activeImg};transition:background .3s ease`}></div>
          <div style={sx`display:flex;gap:10px`}>
            {pd.thumbs.map((t, i) => (
              <button key={i} type="button" onClick={t.pick} aria-label={t.label} style={sx`width:76px;height:76px;border-radius:11px;border:2px solid ${t.border};background:${t.bg};cursor:pointer;padding:0;transition:border-color .18s ease`}></button>
            ))}
          </div>
        </div>
        <div style={sx`display:flex;flex-direction:column;gap:16px`}>
          <div style={sx`display:flex;flex-wrap:wrap;gap:8px`}>
            {pd.hasSale && <span style={sx`background:#C0392B;color:#fff;font-size:11.5px;font-weight:700;padding:5px 10px;border-radius:6px`}>{pd.discountText}</span>}
            {pd.isNew && <span style={sx`background:#1F4E4A;color:#fff;font-size:11.5px;font-weight:700;padding:5px 10px;border-radius:6px`}>جديد</span>}
            <span style={sx`background:#F4F1EC;color:#7C766D;font-size:11.5px;font-weight:600;padding:5px 10px;border-radius:6px`}>SKU {pd.sku}</span>
          </div>
          <h1 style={sx`margin:0;font-size:clamp(21px,3vw,30px);font-weight:800;line-height:1.5;text-wrap:pretty`}>{pd.name}</h1>
          <div style={sx`display:flex;align-items:center;gap:10px;font-size:13px;color:#7C766D`}><span style={sx`color:#C9A24B;font-size:15px`}>★★★★★</span><strong style={sx`color:#1E1B18`}>{pd.ratingText}</strong><span>{pd.reviewsFull}</span><span style={sx`color:${pd.stockColor};font-weight:700`}>{pd.stockText}</span></div>
          <div style={sx`display:flex;align-items:baseline;gap:12px;padding:14px 0;border-block:1px solid #F0EBE3`}>
            <span style={sx`font-size:30px;font-weight:800;color:#1F4E4A`}>{pd.priceText}</span>
            {pd.hasSale && <span style={sx`font-size:17px;color:#A39C90;text-decoration:line-through`}>{pd.oldText}</span>}
            {pd.hasSale && <span style={sx`font-size:13px;color:#C0392B;font-weight:700`}>توفّر {pd.savedText}</span>}
          </div>
          <p style={sx`margin:0;font-size:14.5px;line-height:1.9;color:#4A453E;text-wrap:pretty`}>{pd.short}</p>
          {pd.hasVariation && (
            <div style={sx`display:flex;flex-direction:column;gap:9px`}>
              <span style={sx`font-size:13.5px;font-weight:700`}>{pd.varLabel}</span>
              <div style={sx`display:flex;flex-wrap:wrap;gap:9px`}>
                {pd.varOptions.map((o) => (
                  <button key={o.label} type="button" onClick={o.pick} style={sx`height:42px;padding:0 18px;border:1.5px solid ${o.border};border-radius:10px;background:${o.bg};color:${o.color};font-size:13.5px;font-weight:700;cursor:pointer;transition:all .18s ease`}>{o.label}</button>
                ))}
              </div>
            </div>
          )}
          <div style={sx`display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:4px`}>
            <div style={sx`display:flex;align-items:center;border:1px solid #E1DACE;border-radius:11px;height:52px;overflow:hidden;background:#fff`}>
              <button type="button" onClick={v.qtyDown} aria-label="إنقاص الكمية" className="hv-sand" style={sx`width:46px;height:100%;border:0;background:transparent;font-size:19px;color:#4A453E;cursor:pointer`}>−</button>
              <span aria-live="polite" style={sx`width:44px;text-align:center;font-size:15px;font-weight:800`}>{v.pQty}</span>
              <button type="button" onClick={v.qtyUp} aria-label="زيادة الكمية" className="hv-sand" style={sx`width:46px;height:100%;border:0;background:transparent;font-size:19px;color:#4A453E;cursor:pointer`}>+</button>
            </div>
            <button type="button" onClick={v.addFromPdp} disabled={pd.soldOut} className={pd.soldOut ? undefined : "hv-teal-dark"} style={sx`flex:1;min-width:200px;height:52px;border:0;border-radius:11px;background:${pd.mainBtnBg};color:#fff;font-size:15px;font-weight:800;cursor:${pd.btnCursor};transition:background .2s ease`}>{pd.mainBtnLabel}</button>
            <a href={v.waHref} target="_blank" rel="noopener" className="hv-fill-green" style={sx`height:52px;display:flex;align-items:center;gap:9px;padding:0 20px;border:1.5px solid #2E7D5B;border-radius:11px;color:#2E7D5B;font-size:14px;font-weight:800;transition:background .2s ease,color .2s ease`}>استفسر عبر واتساب</a>
          </div>
          <div style={sx`display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:6px`}>
            <span style={sx`display:flex;align-items:center;gap:9px;font-size:12.5px;color:#4A453E;background:#fff;border:1px solid #E9E3DA;border-radius:10px;padding:11px 13px`}><span style={sx`color:#1F4E4A`}>⛟</span>شحن خلال ١–٤ أيام عمل</span>
            <span style={sx`display:flex;align-items:center;gap:9px;font-size:12.5px;color:#4A453E;background:#fff;border:1px solid #E9E3DA;border-radius:10px;padding:11px 13px`}><span style={sx`color:#1F4E4A`}>↺</span>إرجاع خلال ١٤ يوماً</span>
            <span style={sx`display:flex;align-items:center;gap:9px;font-size:12.5px;color:#4A453E;background:#fff;border:1px solid #E9E3DA;border-radius:10px;padding:11px 13px`}><span style={sx`color:#1F4E4A`}>✓</span>دفع عند الاستلام</span>
          </div>
        </div>
      </section>

      <section style={sx`max-width:1360px;margin:0 auto;padding:44px var(--pad) 0`}>
        <div style={sx`display:flex;gap:6px;border-bottom:1px solid #E9E3DA;overflow-x:auto;scrollbar-width:none`}>
          {v.pdpTabs.map((t) => (
            <button key={t.label} type="button" onClick={t.pick} style={sx`position:relative;height:50px;padding:0 18px;border:0;background:transparent;font-size:14px;font-weight:${t.weight};color:${t.color};cursor:pointer;white-space:nowrap`}>{t.label}<span style={sx`position:absolute;bottom:-1px;inset-inline:12px;height:2.5px;background:#1F4E4A;transform:scaleX(${t.active});transition:transform .22s cubic-bezier(.22,.61,.36,1)`}></span></button>
          ))}
        </div>
        <div style={sx`background:#fff;border:1px solid #E9E3DA;border-top:0;border-radius:0 0 14px 14px;padding:26px`}>
          {v.tabDesc && (
            <div style={sx`display:flex;flex-direction:column;gap:14px;max-width:760px`}>
              <p style={sx`margin:0;font-size:14.5px;line-height:1.95;color:#4A453E`}>{pd.short}</p>
              <p style={sx`margin:0;font-size:14.5px;line-height:1.95;color:#4A453E`}>يُنصح باستخدام المنتج في مكان جيد التهوية وبدرجة حرارة بين ٢٠ و٢٥ مئوية للحصول على أفضل نتيجة. تجنّب الخلط السريع لتقليل الفقاعات، واترك الخليط دقيقتين قبل الصب.</p>
              <ul style={sx`margin:0;padding-inline-start:20px;display:flex;flex-direction:column;gap:8px;font-size:14px;color:#4A453E;line-height:1.8`}><li>مناسب للاستخدام الحرفي والتجاري الخفيف</li><li>يُشحن بتغليف محكم يحمي المحتوى أثناء النقل</li><li>مرفق ورقة إرشادات بالعربية مع كل طلب</li></ul>
            </div>
          )}
          {v.tabSpecs && (
            <div style={sx`display:flex;flex-direction:column;max-width:620px`}>
              {pd.specs.map((s) => (
                <div key={s.k} style={sx`display:flex;justify-content:space-between;gap:16px;padding:13px 0;border-bottom:1px solid #F0EBE3;font-size:14px`}><span style={sx`color:#7C766D`}>{s.k}</span><strong style={sx`font-weight:700`}>{s.v}</strong></div>
              ))}
            </div>
          )}
          {v.tabReviews && (
            <div style={sx`display:flex;flex-direction:column;gap:16px;max-width:760px`}>
              {pd.reviewList.map((r) => (
                <div key={r.name} style={sx`border:1px solid #F0EBE3;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:7px`}>
                  <div style={sx`display:flex;align-items:center;gap:10px`}><span style={sx`width:36px;height:36px;border-radius:50%;background:#F1F5F4;color:#1F4E4A;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px`}>{r.initial}</span><strong style={sx`font-size:14px`}>{r.name}</strong><span style={sx`color:#C9A24B;font-size:13px`}>{r.stars}</span><span style={sx`margin-inline-start:auto;font-size:12px;color:#9C958A`}>{r.date}</span></div>
                  <p style={sx`margin:0;font-size:14px;line-height:1.85;color:#4A453E`}>{r.text}</p>
                </div>
              ))}
            </div>
          )}
          {v.tabShipping && (
            <div style={sx`display:flex;flex-direction:column;gap:12px;max-width:700px;font-size:14.5px;line-height:1.95;color:#4A453E`}>
              <p style={sx`margin:0`}>نشحن الطلبات خلال ٢٤ ساعة من التأكيد في أيام العمل. تختلف مدة التوصيل حسب المنطقة بين يوم واحد وأربعة أيام عمل.</p>
              {v.areas.map((a) => (
                <div key={a.id} style={sx`display:flex;justify-content:space-between;gap:14px;padding:11px 0;border-bottom:1px solid #F0EBE3;font-size:14px`}><span>{a.name}</span><span style={sx`color:#7C766D`}>{a.eta}</span><strong>{a.priceText}</strong></div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0`}>
        <h2 style={sx`margin:0 0 20px;font-size:var(--h2);font-weight:800`}>منتجات ذات صلة</h2>
        <div style={sx`display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:18px`}>
          {v.related.map((item) => <ProductCard key={item.id} p={item} />)}
        </div>
      </section>
    </>
  );
}

export function ViewedSection({ v }) {
  return (
    <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0`}>
      <h2 style={sx`margin:0 0 20px;font-size:var(--h2);font-weight:800`}>شاهدت مؤخراً</h2>
      <div style={sx`display:flex;gap:18px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none`}>
        {v.viewed.map((item) => (
          <div key={item.id} style={sx`flex:0 0 clamp(200px,22%,270px)`}><ProductCard p={item} /></div>
        ))}
      </div>
    </section>
  );
}
