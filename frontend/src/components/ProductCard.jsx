import sx from "../sx.js";

// Ported from ProductCard.dc.html — expects a decorated product (see deco() in App.jsx).
export default function ProductCard({ p }) {
  if (!p) return null;
  return (
    <div className="hv-card" style={sx`display:flex;flex-direction:column;background:#ffffff;border:1px solid #E9E3DA;border-radius:14px;overflow:hidden;transition:transform .22s cubic-bezier(.22,.61,.36,1),box-shadow .22s ease,border-color .22s ease;box-shadow:0 1px 2px rgba(30,27,24,.04);height:100%`}>
      <div style={sx`position:relative;overflow:hidden;background:#F4F1EC`}>
        <a href={p.href} onClick={p.go} aria-label={p.name} style={sx`display:block;aspect-ratio:1 / 1;overflow:hidden;text-decoration:none`}>
          <div className="hv-zoom6" style={sx`width:100%;height:100%;background:${p.bg};transition:transform .5s cubic-bezier(.22,.61,.36,1)`}></div>
        </a>
        <div style={sx`position:absolute;top:10px;inset-inline-start:10px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;pointer-events:none`}>
          {p.hasSale && <span style={sx`background:#C0392B;color:#fff;font-size:11px;font-weight:700;padding:4px 8px;border-radius:6px;letter-spacing:.02em`}>{p.discountText}</span>}
          {p.isNew && <span style={sx`background:#1F4E4A;color:#fff;font-size:11px;font-weight:700;padding:4px 8px;border-radius:6px`}>جديد</span>}
          {p.featured && <span style={sx`background:#fff;color:#8A6A1F;border:1px solid #E3D3AA;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px`}>مُختار</span>}
        </div>
        <button type="button" onClick={p.wish} aria-label="إضافة إلى المفضلة" title="إضافة إلى المفضلة" className="hv-danger" style={sx`position:absolute;top:10px;inset-inline-end:10px;width:34px;height:34px;border-radius:50%;border:1px solid #E9E3DA;background:rgba(255,255,255,.92);color:#7C766D;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:color .18s ease,border-color .18s ease`}>♡</button>
        <button type="button" onClick={p.quick} className="hv-show" style={sx`position:absolute;bottom:0;inset-inline:0;height:38px;border:0;background:rgba(31,78,74,.94);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;opacity:0;transition:opacity .2s ease`}>نظرة سريعة</button>
        {p.soldOut && (
          <div style={sx`position:absolute;inset:0;background:rgba(251,249,246,.72);display:flex;align-items:center;justify-content:center`}>
            <span style={sx`background:#1E1B18;color:#fff;font-size:12px;font-weight:700;padding:7px 14px;border-radius:8px`}>غير متوفر حالياً</span>
          </div>
        )}
      </div>
      <div style={sx`display:flex;flex-direction:column;gap:7px;padding:13px 14px 14px;flex:1`}>
        <span style={sx`font-size:11.5px;color:#9C958A;letter-spacing:.01em`}>{p.categoryName}</span>
        <a href={p.href} onClick={p.go} className="hv-teal-text" style={sx`font-size:14.5px;font-weight:600;line-height:1.5;color:#1E1B18;text-decoration:none;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:44px`}>{p.name}</a>
        <div style={sx`display:flex;align-items:center;gap:5px;font-size:12px;color:#7C766D`}>
          <span style={sx`color:#C9A24B;font-size:13px`}>★</span>
          <span style={sx`font-weight:600;color:#1E1B18`}>{p.ratingText}</span>
          <span>{p.reviewsText}</span>
        </div>
        <div style={sx`display:flex;align-items:baseline;gap:8px;margin-top:auto;padding-top:4px`}>
          <span style={sx`font-size:17px;font-weight:800;color:#1F4E4A;font-feature-settings:'tnum'`}>{p.priceText}</span>
          {p.hasSale && <span style={sx`font-size:13px;color:#A39C90;text-decoration:line-through`}>{p.oldText}</span>}
        </div>
        <button type="button" onClick={p.add} disabled={p.soldOut} className={p.soldOut ? undefined : "hv-fill-teal"} style={sx`margin-top:6px;height:40px;border-radius:10px;border:1px solid ${p.btnBorder};background:${p.btnBg};color:${p.btnColor};font-family:inherit;font-size:13.5px;font-weight:700;cursor:${p.btnCursor};display:flex;align-items:center;justify-content:center;gap:7px;transition:background .18s ease,color .18s ease,border-color .18s ease`}>
          <span style={sx`font-size:15px`}>{p.btnIcon}</span>
          {p.btnLabel}
        </button>
      </div>
    </div>
  );
}
