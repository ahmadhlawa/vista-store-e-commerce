import sx from "../sx";
import type App from "../App";
type View = ReturnType<App["renderVals"]>;

export default function Footer({ v }: { v: View }) {
  return (
    <footer style={sx`margin-top:var(--sec);background:#1A1815;color:#C9C3B9`}>
      <div style={sx`max-width:1360px;margin:0 auto;padding:46px var(--pad) 30px;display:grid;grid-template-columns:var(--foot);gap:28px`}>
        <div style={sx`display:flex;flex-direction:column;gap:12px`}>
          <span style={sx`font-family:'Marcellus',serif;font-size:26px;letter-spacing:.14em;color:#fff`}>TEST</span>
          <p style={sx`margin:0;font-size:13.5px;line-height:1.9;max-width:300px`}>متجر متخصص في مستلزمات الريزن والشموع: مواد مختبرة داخل الورشة، إرشادات بالعربية، وأسعار جملة لأصحاب المشاريع.</p>
          <div style={sx`display:flex;gap:9px;margin-top:4px`}>
            <a href={v.instagram} target="_blank" rel="noopener" aria-label="إنستغرام" className="hv-gold-fill" style={sx`width:40px;height:40px;border:1px solid #35312B;border-radius:11px;display:flex;align-items:center;justify-content:center;color:#C9C3B9;font-size:14px;transition:background .18s ease,color .18s ease`}>IG</a>
            <a href={v.facebook} target="_blank" rel="noopener" aria-label="فيسبوك" className="hv-gold-fill" style={sx`width:40px;height:40px;border:1px solid #35312B;border-radius:11px;display:flex;align-items:center;justify-content:center;color:#C9C3B9;font-size:14px;transition:background .18s ease,color .18s ease`}>FB</a>
            <a href={v.waHref} target="_blank" rel="noopener" aria-label="واتساب" className="hv-gold-fill" style={sx`width:40px;height:40px;border:1px solid #35312B;border-radius:11px;display:flex;align-items:center;justify-content:center;color:#C9C3B9;font-size:14px;transition:background .18s ease,color .18s ease`}>WA</a>
          </div>
        </div>
        {v.footerCols.map((col) => (
          <div key={col.title} style={sx`display:flex;flex-direction:column;gap:11px`}>
            <strong style={sx`font-size:14.5px;color:#fff`}>{col.title}</strong>
            {col.items.map((it) => (
              <a key={it.label} href={it.href} className="hv-gold-text" style={sx`font-size:13.5px;color:#A9A399;transition:color .18s ease`}>{it.label}</a>
            ))}
          </div>
        ))}
        <div style={sx`display:flex;flex-direction:column;gap:11px`}>
          <strong style={sx`font-size:14.5px;color:#fff`}>تواصل معنا</strong>
          <span style={sx`font-size:13.5px;color:#A9A399`}>{v.phone}</span>
          <span style={sx`font-size:13.5px;color:#A9A399`}>{v.location}</span>
          <span style={sx`font-size:13.5px;color:#A9A399`}>{v.hours}</span>
          <div style={sx`display:flex;gap:7px;margin-top:6px;flex-wrap:wrap`}>
            <span style={sx`height:30px;padding:0 11px;border:1px solid #35312B;border-radius:7px;display:flex;align-items:center;font-size:11px;color:#8D877E`}>VISA</span>
            <span style={sx`height:30px;padding:0 11px;border:1px solid #35312B;border-radius:7px;display:flex;align-items:center;font-size:11px;color:#8D877E`}>MASTERCARD</span>
            <span style={sx`height:30px;padding:0 11px;border:1px solid #35312B;border-radius:7px;display:flex;align-items:center;font-size:11px;color:#8D877E`}>الدفع عند الاستلام</span>
          </div>
        </div>
      </div>
      <div style={sx`border-top:1px solid #2A2722`}><div style={sx`max-width:1360px;margin:0 auto;padding:16px var(--pad);display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between;font-size:12.5px;color:#8D877E`}><span>© ٢٠٢٦ TEST — جميع الحقوق محفوظة</span><span>صُمّم وطُوّر لعرض تجريبي</span></div></div>
    </footer>
  );
}
