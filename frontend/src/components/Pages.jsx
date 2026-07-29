import sx from "../sx.js";

export function AuthPage({ v }) {
  return (
    <section style={sx`max-width:520px;margin:0 auto;padding:40px var(--pad) 70px`}>
      <div style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:16px;padding:28px`}>
        <div style={sx`display:flex;gap:6px;background:#F4F1EC;border-radius:11px;padding:5px;margin-bottom:22px`}>
          <button type="button" onClick={v.tabLogin} style={sx`flex:1;height:42px;border:0;border-radius:9px;background:${v.loginTabBg};color:${v.loginTabColor};font-size:14px;font-weight:800;cursor:pointer;transition:all .18s ease`}>تسجيل الدخول</button>
          <button type="button" onClick={v.tabRegister} style={sx`flex:1;height:42px;border:0;border-radius:9px;background:${v.regTabBg};color:${v.regTabColor};font-size:14px;font-weight:800;cursor:pointer;transition:all .18s ease`}>حساب جديد</button>
        </div>
        <form onSubmit={v.submitAuth} style={sx`display:flex;flex-direction:column;gap:14px`}>
          {v.isRegister && (
            <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>الاسم الكامل<input type="text" value={v.auth.name} onChange={v.setAuthName} placeholder="الاسم كما تريده على الطلبات" style={sx`height:48px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} /></label>
          )}
          <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>رقم الهاتف أو البريد<input type="text" value={v.auth.id} onChange={v.setAuthId} placeholder="05XXXXXXXX" style={sx`height:48px;border:1px solid ${v.authErrBorder};border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} /></label>
          <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>كلمة المرور<input type="password" value={v.auth.pass} onChange={v.setAuthPass} placeholder="٦ أحرف على الأقل" style={sx`height:48px;border:1px solid ${v.authErrBorder};border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} /></label>
          {v.authError && <span style={sx`font-size:12.5px;color:#C0392B;font-weight:600`}>{v.authError}</span>}
          <button type="submit" style={sx`height:50px;border:0;border-radius:11px;background:#1F4E4A;color:#fff;font-size:15px;font-weight:800;cursor:pointer`}>{v.authCta}</button>
          <span style={sx`font-size:12.5px;color:#9C958A;text-align:center`}>هذه واجهة تجريبية — سيتم ربطها بواجهة FastAPI لاحقاً.</span>
        </form>
      </div>
    </section>
  );
}

export function AccountPage({ v }) {
  return (
    <section style={sx`max-width:1100px;margin:0 auto;padding:30px var(--pad) 70px`}>
      <h1 style={sx`margin:0 0 20px;font-size:var(--h1);font-weight:800`}>حسابي</h1>
      <div style={sx`display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px`}>
        <a href="#/track-order" className="hv-border-teal" style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:6px`}><strong style={sx`font-size:15.5px;color:#1E1B18`}>طلباتي</strong><span style={sx`font-size:13px;color:#7C766D`}>تتبّع حالة الطلبات السابقة</span></a>
        <a href="#/login" className="hv-border-teal" style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:6px`}><strong style={sx`font-size:15.5px;color:#1E1B18`}>تسجيل الدخول</strong><span style={sx`font-size:13px;color:#7C766D`}>ادخل إلى حسابك لمتابعة طلباتك</span></a>
        <a href="#/cart" className="hv-border-teal" style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:6px`}><strong style={sx`font-size:15.5px;color:#1E1B18`}>عربتي</strong><span style={sx`font-size:13px;color:#7C766D`}>{v.cartLineText}</span></a>
        <a href="#/contact" className="hv-border-teal" style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:6px`}><strong style={sx`font-size:15.5px;color:#1E1B18`}>الدعم</strong><span style={sx`font-size:13px;color:#7C766D`}>تواصل معنا لأي استفسار فني</span></a>
      </div>
    </section>
  );
}

export function TrackPage({ v }) {
  return (
    <section style={sx`max-width:720px;margin:0 auto;padding:40px var(--pad) 70px`}>
      <h1 style={sx`margin:0 0 8px;font-size:var(--h1);font-weight:800`}>تتبّع الطلب</h1>
      <p style={sx`margin:0 0 22px;font-size:14px;color:#7C766D`}>أدخل رقم الطلب الذي وصلك في رسالة التأكيد (مثال: TST-123456).</p>
      <form onSubmit={v.doTrack} style={sx`display:flex;gap:10px;flex-wrap:wrap`}>
        <input type="text" value={v.trackId} onChange={v.setTrackId} placeholder="TST-123456" aria-label="رقم الطلب" style={sx`flex:1;min-width:200px;height:52px;border:1px solid #E1DACE;border-radius:11px;background:#fff;padding:0 14px;font-size:14.5px`} />
        <button type="submit" style={sx`height:52px;padding:0 28px;border:0;border-radius:11px;background:#1F4E4A;color:#fff;font-size:14.5px;font-weight:800;cursor:pointer`}>{v.trackLabel}</button>
      </form>
      {v.trackError && <p style={sx`margin:16px 0 0;font-size:13.5px;color:#C0392B;font-weight:600`}>{v.trackError}</p>}
      {v.trackOk && (
        <div style={sx`margin-top:26px;background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:24px;animation:fadeUp .35s ease both`}>
          <h2 style={sx`margin:0 0 18px;font-size:17px;font-weight:800`}>الطلب {v.trackNum}</h2>
          {v.trackSteps.map((s) => (
            <div key={s.title} style={sx`display:flex;gap:14px;align-items:flex-start;padding-bottom:18px`}>
              <span style={sx`width:26px;height:26px;border-radius:50%;background:${s.dotBg};color:${s.dotColor};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex:0 0 auto`}>{s.mark}</span>
              <span style={sx`display:flex;flex-direction:column;gap:3px`}><strong style={sx`font-size:14.5px;color:${s.titleColor}`}>{s.title}</strong><span style={sx`font-size:12.5px;color:#9C958A`}>{s.time}</span></span>
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
      <div style={sx`display:grid;grid-template-columns:repeat(var(--art),minmax(0,1fr));gap:18px`}>
        {v.articles.map((a) => (
          <a key={a.slug} href={a.href} className="hv-lift" style={sx`display:flex;flex-direction:column;background:#fff;border:1px solid #E9E3DA;border-radius:14px;overflow:hidden;transition:transform .22s ease,box-shadow .22s ease`}>
            <span style={sx`aspect-ratio:16 / 10;background:${a.bg};display:block`}></span>
            <span style={sx`padding:15px 16px 18px;display:flex;flex-direction:column;gap:8px`}>
              <span style={sx`font-size:11.5px;color:#C9A24B;font-weight:700`}>{a.cat}</span>
              <strong style={sx`font-size:15px;line-height:1.6;color:#1E1B18`}>{a.title}</strong>
              <span style={sx`font-size:13px;line-height:1.75;color:#7C766D`}>{a.excerpt}</span>
              <span style={sx`font-size:11.5px;color:#9C958A;margin-top:4px`}>{a.date} · {a.read}</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function ArticlePage({ v }) {
  return (
    <section style={sx`max-width:760px;margin:0 auto;padding:30px var(--pad) 70px`}>
      <nav style={sx`display:flex;gap:8px;font-size:12.5px;color:#9C958A;margin-bottom:14px`}><a href="#/blog" style={sx`color:#7C766D`}>المدونة</a><span>›</span><span style={sx`color:#1E1B18`}>{v.art.cat}</span></nav>
      <h1 style={sx`margin:0 0 10px;font-size:clamp(24px,4vw,36px);font-weight:800;line-height:1.5`}>{v.art.title}</h1>
      <p style={sx`margin:0 0 20px;font-size:13px;color:#9C958A`}>{v.art.date} · {v.art.read} قراءة</p>
      <div style={sx`aspect-ratio:16 / 9;border-radius:16px;background:${v.art.bg};margin-bottom:24px`}></div>
      <div style={sx`display:flex;flex-direction:column;gap:16px;font-size:15.5px;line-height:2;color:#3B3730`}>
        <p style={sx`margin:0`}>{v.art.excerpt}</p>
        <p style={sx`margin:0`}>النتيجة النهائية تعتمد على ثلاثة عوامل: دقة القياس، درجة حرارة الغرفة، وطريقة الخلط. عندما تضبط هذه العوامل الثلاثة تصبح النتائج قابلة للتكرار في كل مرة، وهذا بالضبط ما يفرّق العمل الاحترافي عن المحاولات العشوائية.</p>
        <h2 style={sx`margin:10px 0 0;font-size:21px;font-weight:800`}>الخطوات العملية</h2>
        <ul style={sx`margin:0;padding-inline-start:22px;display:flex;flex-direction:column;gap:10px`}><li>اضبط الميزان على دقة ٠.٠١ غم وقس المكونات بالوزن لا بالحجم.</li><li>اخلط ببطء لمدة ثلاث دقائق مع كشط الجوانب والقاع.</li><li>اترك الخليط دقيقتين قبل الصب لتصعد الفقاعات.</li><li>مرّر المسدس الحراري على السطح من مسافة ٢٠ سم.</li></ul>
        <p style={sx`margin:0`}>إذا ظهرت فقاعات دقيقة بعد الجفاف فالسبب غالباً برودة الغرفة أو خلط سريع أدخل هواء في الخليط. ارفع حرارة الغرفة درجتين وأعد المحاولة.</p>
      </div>
      <a href="#/blog" style={sx`display:inline-block;margin-top:28px;font-size:13.5px;font-weight:700`}>→ العودة إلى المدونة</a>
    </section>
  );
}

export function StaticPage({ v }) {
  return (
    <section style={sx`max-width:820px;margin:0 auto;padding:36px var(--pad) 70px`}>
      <h1 style={sx`margin:0 0 10px;font-size:var(--h1);font-weight:800`}>{v.page.title}</h1>
      <p style={sx`margin:0 0 24px;font-size:16px;color:#4A453E;line-height:1.9`}>{v.page.lead}</p>
      <div style={sx`display:flex;flex-direction:column;gap:16px`}>
        {v.page.body.map((b, i) => (
          <p key={i} style={sx`margin:0;font-size:15px;line-height:2;color:#3B3730`}>{b.text}</p>
        ))}
      </div>
    </section>
  );
}

export function ContactPage({ v }) {
  return (
    <section style={sx`max-width:1100px;margin:0 auto;padding:36px var(--pad) 70px`}>
      <h1 style={sx`margin:0 0 10px;font-size:var(--h1);font-weight:800`}>اتصل بنا</h1>
      <p style={sx`margin:0 0 26px;font-size:15px;color:#7C766D`}>فريق الدعم متاح {v.hours} — نرد عادة خلال ساعتين في أيام العمل.</p>
      <div style={sx`display:grid;grid-template-columns:var(--pdp);gap:24px;align-items:start`}>
        <form onSubmit={v.submitContact} style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:14px`}>
          <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>الاسم<input type="text" value={v.contact.name} onChange={v.setContactName} style={sx`height:48px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} /></label>
          <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>رقم الهاتف<input type="tel" value={v.contact.phone} onChange={v.setContactPhone} style={sx`height:48px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} /></label>
          <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>رسالتك<textarea value={v.contact.msg} onChange={v.setContactMsg} rows="5" style={sx`border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:12px 13px;font-size:14px;font-weight:400;resize:vertical`}></textarea></label>
          <button type="submit" style={sx`height:50px;border:0;border-radius:11px;background:#1F4E4A;color:#fff;font-size:15px;font-weight:800;cursor:pointer`}>إرسال الرسالة</button>
        </form>
        <div style={sx`display:flex;flex-direction:column;gap:12px`}>
          <div style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:12px`}>
            <div style={sx`display:flex;flex-direction:column;gap:3px`}><span style={sx`font-size:12px;color:#9C958A`}>الهاتف</span><strong style={sx`font-size:15px`}>{v.phone}</strong></div>
            <div style={sx`display:flex;flex-direction:column;gap:3px`}><span style={sx`font-size:12px;color:#9C958A`}>واتساب</span><strong style={sx`font-size:15px`}>{v.whatsapp}</strong></div>
            <div style={sx`display:flex;flex-direction:column;gap:3px`}><span style={sx`font-size:12px;color:#9C958A`}>الموقع</span><strong style={sx`font-size:15px`}>{v.location}</strong></div>
            <div style={sx`display:flex;flex-direction:column;gap:3px`}><span style={sx`font-size:12px;color:#9C958A`}>ساعات العمل</span><strong style={sx`font-size:15px`}>{v.hours}</strong></div>
          </div>
          <a href={v.waHref} target="_blank" rel="noopener" style={sx`height:54px;display:flex;align-items:center;justify-content:center;gap:9px;border-radius:12px;background:#2E7D5B;color:#fff;font-size:15px;font-weight:800`}>تواصل عبر واتساب</a>
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
          <a href="#/category/resin" style={sx`margin-top:6px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:#C9A24B;color:#1E1B18;font-size:14.5px;font-weight:800`}>تسوّق الراتنج المناسب</a>
          <span style={sx`font-size:11.5px;color:#A9CBC5;line-height:1.7`}>التقدير محسوب بكثافة ١.١ غم/سم³ مع هامش أمان ١٠٪.</span>
        </div>
      </div>
    </section>
  );
}
