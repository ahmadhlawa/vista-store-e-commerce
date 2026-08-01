import sx from "../sx.js";
import A from "../utils/A.jsx";

export function OrderSuccessPage({ v }) {
  return (
    <section style={sx`max-width:1100px;margin:0 auto;padding:26px var(--pad) 60px`}>
      {v.loading && <p style={sx`margin:40px 0;text-align:center;font-size:14px;color:#7C766D`}>جارٍ تحميل تفاصيل الطلب…</p>}
      {v.notFound && (
        <div style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:16px;padding:56px 26px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px`}>
          <h1 style={sx`margin:0;font-size:22px;font-weight:800`}>تعذّر عرض تفاصيل هذا الطلب</h1>
          <p style={sx`margin:0;font-size:14.5px;color:#7C766D;max-width:460px;line-height:1.9`}>رابط تأكيد الطلب صالح على المتصفح الذي أُنشئ منه الطلب فقط. تواصل معنا وسنساعدك.</p>
          <A href="/contact" style={sx`margin-top:8px;height:48px;display:flex;align-items:center;padding:0 24px;border-radius:11px;background:#1F4E4A;color:#fff;font-weight:800;font-size:14px`}>تواصل معنا</A>
        </div>
      )}
      {v.order && (
        <div style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:16px;padding:40px 26px;display:flex;flex-direction:column;align-items:center;gap:12px;animation:popIn .3s ease both`}>
          <span style={sx`width:74px;height:74px;border-radius:50%;background:#E8F3EE;color:#2E7D5B;display:flex;align-items:center;justify-content:center;font-size:32px`}>✓</span>
          <h1 style={sx`margin:8px 0 0;font-size:26px;font-weight:800`}>تم استلام طلبك بنجاح</h1>
          <p style={sx`margin:0;font-size:14.5px;color:#7C766D;text-align:center`}>رقم الطلب <strong style={sx`color:#1E1B18`}>{v.order.order_number}</strong> — الحالة: {v.statusLabel}</p>
          <div style={sx`width:100%;max-width:560px;margin-top:14px;display:flex;flex-direction:column;gap:9px`}>
            {v.order.items.map((item) => (
              <div key={item.id} style={sx`display:flex;justify-content:space-between;gap:12px;font-size:13.5px;padding-bottom:9px;border-bottom:1px solid #F5F1EA`}>
                <span>{item.product_name} ×{item.quantity}</span>
                <strong>{v.money(item.line_total)}</strong>
              </div>
            ))}
            <div style={sx`display:flex;justify-content:space-between;font-size:13.5px;color:#4A453E`}><span>المجموع الفرعي</span><strong>{v.money(v.order.subtotal)}</strong></div>
            {v.order.discount > 0 && <div style={sx`display:flex;justify-content:space-between;font-size:13.5px;color:#2E7D5B`}><span>الخصم</span><strong>−{v.money(v.order.discount)}</strong></div>}
            <div style={sx`display:flex;justify-content:space-between;font-size:13.5px;color:#4A453E`}><span>الشحن {v.order.delivery_area_name && `(${v.order.delivery_area_name})`}</span><strong>{v.money(v.order.delivery_fee)}</strong></div>
            <div style={sx`border-top:1px solid #F0EBE3;padding-top:11px;display:flex;justify-content:space-between;align-items:baseline`}><span style={sx`font-size:15px;font-weight:800`}>الإجمالي</span><strong style={sx`font-size:22px;color:#1F4E4A`}>{v.money(v.order.total)}</strong></div>
          </div>
          <div style={sx`display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:14px`}>
            <A href="/track-order" style={sx`height:48px;display:flex;align-items:center;padding:0 24px;border-radius:11px;background:#1F4E4A;color:#fff;font-weight:800;font-size:14px`}>تتبّع الطلب</A>
            <A href="/shop" style={sx`height:48px;display:flex;align-items:center;padding:0 24px;border-radius:11px;border:1px solid #E1DACE;color:#1E1B18;font-weight:700;font-size:14px`}>متابعة التسوّق</A>
          </div>
        </div>
      )}
    </section>
  );
}

export function TrackPage({ v }) {
  return (
    <section style={sx`max-width:720px;margin:0 auto;padding:40px var(--pad) 70px`}>
      <h1 style={sx`margin:0 0 8px;font-size:var(--h1);font-weight:800`}>تتبّع الطلب</h1>
      <p style={sx`margin:0 0 22px;font-size:14px;color:#7C766D;line-height:1.9`}>أدخل رقم الطلب الذي ظهر لك عند التأكيد. يعمل التتبّع على المتصفح الذي أنشأت منه الطلب.</p>
      <form onSubmit={v.doTrack} style={sx`display:flex;gap:10px;flex-wrap:wrap`}>
        <input type="text" value={v.trackId} onChange={v.setTrackId} placeholder="ORD-260731-1234" aria-label="رقم الطلب" dir="ltr" style={sx`flex:1;min-width:200px;height:52px;border:1px solid #E1DACE;border-radius:11px;background:#fff;padding:0 14px;font-size:14.5px;text-align:right`} />
        <button type="submit" style={sx`height:52px;padding:0 28px;border:0;border-radius:11px;background:#1F4E4A;color:#fff;font-size:14.5px;font-weight:800;cursor:pointer`}>{v.trackLabel}</button>
      </form>
      {v.trackError && <p role="alert" style={sx`margin:16px 0 0;font-size:13.5px;color:#C0392B;font-weight:600`}>{v.trackError}</p>}
      {v.trackOrder && (
        <div style={sx`margin-top:26px;background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:24px;animation:fadeUp .35s ease both`}>
          <h2 style={sx`margin:0 0 6px;font-size:17px;font-weight:800`}>الطلب {v.trackOrder.order_number}</h2>
          <p style={sx`margin:0 0 18px;font-size:14px;color:#7C766D`}>الحالة الحالية: <strong style={sx`color:#1F4E4A`}>{v.trackStatusLabel}</strong></p>
          {v.trackSteps.map((s) => (
            <div key={s.title} style={sx`display:flex;gap:14px;align-items:flex-start;padding-bottom:18px`}>
              <span style={sx`width:26px;height:26px;border-radius:50%;background:${s.dotBg};color:${s.dotColor};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex:0 0 auto`}>{s.mark}</span>
              <span style={sx`display:flex;flex-direction:column;gap:3px`}><strong style={sx`font-size:14.5px;color:${s.titleColor}`}>{s.title}</strong></span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function BlogPage({ v }) {
  return (
    <section style={sx`max-width:1360px;margin:0 auto;padding:30px var(--pad) 70px`}>
      <h1 style={sx`margin:0 0 8px;font-size:var(--h1);font-weight:800`}>المدونة</h1>
      <p style={sx`margin:0 0 26px;font-size:14px;color:#7C766D`}>أدلة عملية ونصائح من داخل الورشة.</p>
      {v.loading && <p style={sx`font-size:14px;color:#7C766D`}>جارٍ التحميل…</p>}
      {v.empty && <p style={sx`font-size:14px;color:#7C766D`}>لا توجد مقالات منشورة بعد.</p>}
      <div style={sx`display:grid;grid-template-columns:repeat(var(--art),minmax(0,1fr));gap:18px`}>
        {v.articles.map((a) => (
          <A key={a.slug} href={a.href} className="hv-lift" style={sx`display:flex;flex-direction:column;background:#fff;border:1px solid #E9E3DA;border-radius:14px;overflow:hidden;transition:transform .22s ease,box-shadow .22s ease`}>
            <span style={sx`aspect-ratio:16 / 10;background:${a.bg};display:block`}></span>
            <span style={sx`padding:15px 16px 18px;display:flex;flex-direction:column;gap:8px`}>
              <span style={sx`font-size:11.5px;color:#C9A24B;font-weight:700`}>{a.cat}</span>
              <strong style={sx`font-size:15px;line-height:1.6;color:#1E1B18`}>{a.title}</strong>
              <span style={sx`font-size:13px;line-height:1.75;color:#7C766D`}>{a.excerpt}</span>
              <span style={sx`font-size:11.5px;color:#9C958A;margin-top:4px`}>{a.date} · {a.read}</span>
            </span>
          </A>
        ))}
      </div>
    </section>
  );
}

export function ArticlePage({ v }) {
  const art = v.art;
  return (
    <section style={sx`max-width:760px;margin:0 auto;padding:30px var(--pad) 70px`}>
      <nav style={sx`display:flex;gap:8px;font-size:12.5px;color:#9C958A;margin-bottom:14px`}><A href="/blog" style={sx`color:#7C766D`}>المدونة</A><span>›</span><span style={sx`color:#1E1B18`}>{art.cat}</span></nav>
      <h1 style={sx`margin:0 0 10px;font-size:clamp(24px,4vw,36px);font-weight:800;line-height:1.5`}>{art.title}</h1>
      <p style={sx`margin:0 0 20px;font-size:13px;color:#9C958A`}>{art.date} · {art.read} قراءة</p>
      <div style={sx`aspect-ratio:16 / 9;border-radius:16px;background:${art.bg};margin-bottom:24px`}></div>
      <div style={sx`display:flex;flex-direction:column;gap:16px;font-size:15.5px;line-height:2;color:#3B3730`}>
        {art.excerpt && <p style={sx`margin:0;font-weight:600`}>{art.excerpt}</p>}
        {v.paragraphs.map((text, i) => (
          <p key={i} style={sx`margin:0`}>{text}</p>
        ))}
      </div>
      <A href="/blog" style={sx`display:inline-block;margin-top:28px;font-size:13.5px;font-weight:700`}>→ العودة إلى المدونة</A>
    </section>
  );
}

export function StaticPageView({ v }) {
  return (
    <section style={sx`max-width:820px;margin:0 auto;padding:36px var(--pad) 70px`}>
      <h1 style={sx`margin:0 0 10px;font-size:var(--h1);font-weight:800`}>{v.page.title}</h1>
      {v.page.lead && <p style={sx`margin:0 0 24px;font-size:16px;color:#4A453E;line-height:1.9`}>{v.page.lead}</p>}
      <div style={sx`display:flex;flex-direction:column;gap:16px`}>
        {v.page.body.map((text, i) => (
          <p key={i} style={sx`margin:0;font-size:15px;line-height:2;color:#3B3730`}>{text}</p>
        ))}
      </div>
    </section>
  );
}

export function ContactPage({ v }) {
  return (
    <section style={sx`max-width:1100px;margin:0 auto;padding:36px var(--pad) 70px`}>
      <h1 style={sx`margin:0 0 10px;font-size:var(--h1);font-weight:800`}>اتصل بنا</h1>
      <p style={sx`margin:0 0 26px;font-size:15px;color:#7C766D`}>{v.contactLead}</p>
      <div style={sx`display:grid;grid-template-columns:var(--pdp);gap:24px;align-items:start`}>
        <form onSubmit={v.submitContact} style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:14px`}>
          <p style={sx`margin:0;font-size:13px;color:#7C766D;line-height:1.8`}>اكتب رسالتك وسنفتح لك محادثة واتساب جاهزة للإرسال.</p>
          <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>الاسم<input type="text" value={v.contact.name} onChange={v.setContactName} style={sx`height:48px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} /></label>
          <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>رقم الهاتف<input type="tel" value={v.contact.phone} onChange={v.setContactPhone} style={sx`height:48px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} /></label>
          <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>رسالتك<textarea value={v.contact.msg} onChange={v.setContactMsg} rows="5" style={sx`border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:12px 13px;font-size:14px;font-weight:400;resize:vertical`}></textarea></label>
          {v.contactError && <span style={sx`font-size:12.5px;color:#C0392B;font-weight:600`}>{v.contactError}</span>}
          <button type="submit" style={sx`height:50px;border:0;border-radius:11px;background:#1F4E4A;color:#fff;font-size:15px;font-weight:800;cursor:pointer`}>فتح واتساب بالرسالة</button>
        </form>
        <div style={sx`display:flex;flex-direction:column;gap:12px`}>
          <div style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:12px`}>
            {v.contactRows.map((row) => (
              <div key={row.label} style={sx`display:flex;flex-direction:column;gap:3px`}><span style={sx`font-size:12px;color:#9C958A`}>{row.label}</span><strong style={sx`font-size:15px`}>{row.value}</strong></div>
            ))}
          </div>
          {v.waHref !== "#" && (
            <a href={v.waHref} target="_blank" rel="noopener" style={sx`height:54px;display:flex;align-items:center;justify-content:center;gap:9px;border-radius:12px;background:#2E7D5B;color:#fff;font-size:15px;font-weight:800`}>تواصل عبر واتساب</a>
          )}
        </div>
      </div>
    </section>
  );
}

export function CalculatorPage({ v }) {
  return (
    <section style={sx`max-width:900px;margin:0 auto;padding:36px var(--pad) 70px`}>
      <h1 style={sx`margin:0 0 10px;font-size:var(--h1);font-weight:800`}>حاسبة كمية الريزن</h1>
      <p style={sx`margin:0 0 26px;font-size:15px;color:#7C766D`}>احسب كمية الراتنج والمصلّب اللازمة لقالبك قبل الشراء، بنسبة خلط ٢:١.</p>
      <div style={sx`display:grid;grid-template-columns:var(--pdp);gap:22px;align-items:start`}>
        <div style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:16px`}>
          <div style={sx`display:flex;gap:8px;background:#F4F1EC;border-radius:11px;padding:5px`}>
            <button type="button" onClick={v.calcRound} style={sx`flex:1;height:42px;border:0;border-radius:9px;background:${v.roundBg};color:${v.roundColor};font-size:13.5px;font-weight:800;cursor:pointer`}>قالب دائري</button>
            <button type="button" onClick={v.calcSquare} style={sx`flex:1;height:42px;border:0;border-radius:9px;background:${v.squareBg};color:${v.squareColor};font-size:13.5px;font-weight:800;cursor:pointer`}>قالب مربّع</button>
          </div>
          {v.isRound && (
            <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>القطر (سم)<input type="number" min="1" value={v.calc.dia} onChange={v.setDia} style={sx`height:48px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} /></label>
          )}
          {v.isSquare && (
            <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>طول الضلع (سم)<input type="number" min="1" value={v.calc.side} onChange={v.setSide} style={sx`height:48px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} /></label>
          )}
          <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>السماكة (سم)<input type="number" min="0.2" step="0.2" value={v.calc.height} onChange={v.setHeight} style={sx`height:48px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} /></label>
          <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>عدد القطع<input type="number" min="1" value={v.calc.layers} onChange={v.setLayers} style={sx`height:48px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} /></label>
        </div>
        <div style={sx`background:linear-gradient(160deg,#1F4E4A,#2F6F68);border-radius:14px;padding:24px;color:#fff;display:flex;flex-direction:column;gap:14px`}>
          <span style={sx`font-size:12.5px;color:#A9CBC5;letter-spacing:.08em`}>النتيجة التقديرية</span>
          <div style={sx`display:flex;flex-direction:column;gap:3px`}><span style={sx`font-size:34px;font-weight:800`}>{v.calcTotal}</span><span style={sx`font-size:13px;color:#D8E7E4`}>إجمالي الخليط المطلوب</span></div>
          <div style={sx`border-top:1px solid rgba(255,255,255,.18);padding-top:14px;display:flex;flex-direction:column;gap:9px`}>
            <div style={sx`display:flex;justify-content:space-between;font-size:14px`}><span style={sx`color:#D8E7E4`}>الراتنج (A)</span><strong>{v.calcResin}</strong></div>
            <div style={sx`display:flex;justify-content:space-between;font-size:14px`}><span style={sx`color:#D8E7E4`}>المصلّب (B)</span><strong>{v.calcHard}</strong></div>
            <div style={sx`display:flex;justify-content:space-between;font-size:14px`}><span style={sx`color:#D8E7E4`}>الحجم</span><strong>{v.calcVol}</strong></div>
          </div>
          <A href="/shop?q=%D8%B1%D9%8A%D8%B2%D9%86" style={sx`margin-top:6px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:#C9A24B;color:#1E1B18;font-size:14.5px;font-weight:800`}>تسوّق الراتنج المناسب</A>
          <span style={sx`font-size:11.5px;color:#A9CBC5;line-height:1.7`}>التقدير محسوب بكثافة ١.١ غم/سم³ مع هامش أمان ١٠٪.</span>
        </div>
      </div>
    </section>
  );
}

export function NotFoundPage() {
  return (
    <section style={sx`max-width:720px;margin:0 auto;padding:70px var(--pad);text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px`}>
      <span style={sx`font-family:'Marcellus',serif;font-size:64px;color:#1F4E4A;line-height:1`}>404</span>
      <h1 style={sx`margin:0;font-size:24px;font-weight:800`}>الصفحة غير موجودة</h1>
      <p style={sx`margin:0;font-size:15px;color:#7C766D;line-height:1.9;max-width:420px`}>الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت. يمكنك العودة إلى المتجر ومتابعة التصفّح.</p>
      <div style={sx`display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px`}>
        <A href="/" style={sx`height:48px;display:flex;align-items:center;padding:0 24px;border-radius:11px;background:#1F4E4A;color:#fff;font-weight:800;font-size:14px`}>الصفحة الرئيسية</A>
        <A href="/shop" style={sx`height:48px;display:flex;align-items:center;padding:0 24px;border-radius:11px;border:1px solid #E1DACE;color:#1E1B18;font-weight:700;font-size:14px`}>كل المنتجات</A>
      </div>
    </section>
  );
}
