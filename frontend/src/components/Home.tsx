import sx from "../sx";
import type App from "../App";
type View = ReturnType<App["renderVals"]>;
import ProductCard from "./ProductCard";

export function HomeTop({ v }: { v: View }) {
  return (
    <>
      <section style={sx`max-width:1360px;margin:0 auto;padding:20px var(--pad) 0;display:grid;grid-template-columns:var(--heroG);gap:16px`}>
        <div onMouseEnter={v.pauseHero} onMouseLeave={v.resumeHero} style={sx`position:relative;height:var(--herohGap);border-radius:18px;overflow:hidden;background:#1F4E4A`}>
          {v.heroSlides.map((h) => (
            <div key={h.id} style={sx`position:absolute;inset:0;background:${h.bg};opacity:${h.opacity};transition:opacity .8s cubic-bezier(.4,0,.2,1);display:flex;align-items:center;pointer-events:${h.events}`}>
              <div style={sx`padding:0 clamp(24px,6vw,80px);max-width:660px;display:flex;flex-direction:column;gap:14px;align-items:flex-start`}>
                <span style={sx`font-size:12.5px;letter-spacing:.1em;color:#E4D6B4;background:rgba(0,0,0,.18);padding:6px 12px;border-radius:999px`}>{h.subtitle}</span>
                <h1 style={sx`margin:0;font-size:var(--h1);line-height:1.35;font-weight:800;color:#fff;text-wrap:pretty`}>{h.title}</h1>
                <p style={sx`margin:0;font-size:15px;line-height:1.8;color:#E8EFED;max-width:460px;text-wrap:pretty`}>{h.desc}</p>
                <a href={h.href} className="hv-gold-lift" style={sx`margin-top:6px;display:inline-flex;align-items:center;gap:9px;height:48px;padding:0 26px;border-radius:12px;background:#C9A24B;color:#1E1B18;font-size:14.5px;font-weight:800;transition:transform .2s ease,background .2s ease`}>{h.cta}<span style={sx`font-size:17px`}>←</span></a>
              </div>
            </div>
          ))}
          <div style={sx`position:absolute;bottom:20px;inset-inline-start:clamp(24px,6vw,80px);display:flex;gap:8px;z-index:3`}>
            {v.heroDots.map((d, i) => (
              <button key={i} type="button" onClick={d.go} aria-label={d.label} style={sx`width:${d.w};height:8px;border-radius:99px;border:0;background:${d.bg};cursor:pointer;transition:width .3s ease,background .3s ease;padding:0`}></button>
            ))}
          </div>
          <div style={sx`position:absolute;bottom:18px;inset-inline-end:clamp(24px,6vw,80px);display:var(--desk);gap:8px;z-index:3`}>
            <button type="button" onClick={v.heroPrev} aria-label="الشريحة السابقة" className="hv-glass" style={sx`width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.12);color:#fff;font-size:17px;cursor:pointer;backdrop-filter:blur(4px);transition:background .2s ease`}>→</button>
            <button type="button" onClick={v.heroNext} aria-label="الشريحة التالية" className="hv-glass" style={sx`width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.12);color:#fff;font-size:17px;cursor:pointer;backdrop-filter:blur(4px);transition:background .2s ease`}>←</button>
          </div>
        </div>
        <div style={sx`display:grid;grid-template-rows:1fr 1fr;gap:16px;min-height:var(--herohGap)`}>
          {v.sideBanners.map((b) => (
            <a key={b.title} href={b.href} className="hv-lift3" style={sx`position:relative;border-radius:16px;overflow:hidden;background:${b.bg};padding:24px;display:flex;flex-direction:column;justify-content:center;gap:7px;min-height:150px;transition:transform .22s cubic-bezier(.22,.61,.36,1)`}>
              <span style={sx`font-size:19px;font-weight:800;color:#fff;line-height:1.45`}>{b.title}</span>
              <span style={sx`font-size:13px;color:rgba(255,255,255,.82)`}>{b.desc}</span>
              <span style={sx`margin-top:8px;font-size:13px;font-weight:800;color:#E4D6B4`}>{b.cta} ←</span>
            </a>
          ))}
        </div>
      </section>

      <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0;animation:fadeUp .45s ease both`}>
        <div style={sx`display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:22px`}>
          <div style={sx`display:flex;flex-direction:column;gap:6px`}><span style={sx`font-size:12px;letter-spacing:.12em;color:#C9A24B;font-weight:700`}>تسوّق حسب القسم</span><h2 style={sx`margin:0;font-size:var(--h2);font-weight:800`}>أقسام منتجاتنا</h2></div>
          <a href="#/shop" style={sx`font-size:13.5px;font-weight:700;white-space:nowrap`}>كل الأقسام ←</a>
        </div>
        <div style={sx`display:grid;grid-template-columns:repeat(var(--catcols),minmax(0,1fr));gap:18px`}>
          {v.categories.map((c) => (
            <a key={c.slug} href={c.href} className="cat-tile" style={sx`position:relative;display:block;aspect-ratio:4 / 5;border-radius:16px;overflow:hidden;background:${c.bg};box-shadow:0 1px 2px rgba(30,27,24,.05);transition:transform .26s cubic-bezier(.22,.61,.36,1),box-shadow .26s ease`}>
              <span style={sx`position:absolute;inset:0;background:${c.bg};transition:transform .55s cubic-bezier(.22,.61,.36,1)`}></span>
              <span style={sx`position:absolute;inset:0;background:linear-gradient(to top,rgba(21,19,17,.62) 0%,rgba(21,19,17,.14) 46%,rgba(21,19,17,0) 78%)`}></span>
              <span className="cat-veil" style={sx`position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:18px 14px;background:rgba(21,19,17,0);backdrop-filter:blur(0px);transition:background .3s ease,backdrop-filter .3s ease,align-items .3s ease`}>
                <span style={sx`display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center`}>
                  <span style={sx`font-size:15.5px;font-weight:800;color:#fff;line-height:1.5;text-shadow:0 1px 10px rgba(0,0,0,.35)`}>{c.name}</span>
                  <span className="cat-more" style={sx`font-size:12px;color:rgba(255,255,255,.86);opacity:0;transform:translateY(6px);transition:opacity .28s ease,transform .28s cubic-bezier(.22,.61,.36,1)`}>{c.countText} · تصفّح ←</span>
                </span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0;animation:fadeUp .45s ease both`}>
        <div style={sx`display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:22px`}>
          <div style={sx`display:flex;flex-direction:column;gap:6px`}><span style={sx`font-size:12px;letter-spacing:.12em;color:#C9A24B;font-weight:700`}>ابدأ من هنا</span><h2 style={sx`margin:0;font-size:var(--h2);font-weight:800`}>بكجات المبتدئين</h2></div>
          <a href="#/category/starter-kits" style={sx`font-size:13.5px;font-weight:700;white-space:nowrap`}>عرض الكل ←</a>
        </div>
        <div style={sx`display:grid;grid-template-columns:repeat(var(--kits),minmax(0,1fr));gap:20px`}>
          {v.homeKits.map((k) => (
            <article key={k.id} className="kit-card" style={sx`display:flex;flex-direction:column;background:#fff;border:1px solid #E9E3DA;border-radius:16px;overflow:hidden;transition:transform .24s cubic-bezier(.22,.61,.36,1),box-shadow .24s ease,border-color .24s ease`}>
              <div style={sx`position:relative;aspect-ratio:4 / 5;overflow:hidden;background:${k.bg}`}>
                <span style={sx`position:absolute;inset:0;background:${k.bg}`}></span>
                {k.hasSale && <span style={sx`position:absolute;top:12px;inset-inline-start:12px;z-index:3;background:#C0392B;color:#fff;font-size:11px;font-weight:700;padding:5px 9px;border-radius:6px`}>{k.discountText}</span>}
                <span style={sx`position:absolute;top:12px;inset-inline-end:12px;z-index:3;background:rgba(255,255,255,.92);color:#8A6A1F;font-size:11px;font-weight:800;padding:5px 9px;border-radius:6px`}>بكج كامل</span>
                <a href={k.href} onClick={k.go} aria-label={k.name} className="kit-veil" style={sx`position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;justify-content:flex-end;padding:0;background:rgba(21,19,17,0);opacity:1;transition:background .32s ease`}>
                  <span className="kit-reveal" style={sx`display:flex;flex-direction:column;gap:10px;padding:16px;opacity:0;transform:translateY(14px);transition:opacity .34s ease,transform .34s cubic-bezier(.22,.61,.36,1)`}>
                    <span style={sx`font-size:11.5px;font-weight:800;color:#E4D6B4;letter-spacing:.06em`}>محتويات البكج</span>
                    <span style={sx`display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px`}>
                      {k.contents.map((it) => (
                        <span key={it.label} style={sx`display:flex;flex-direction:column;gap:5px;align-items:center`}>
                          <span style={sx`width:100%;aspect-ratio:1 / 1;border-radius:9px;background:${it.bg};box-shadow:0 2px 8px rgba(0,0,0,.18)`}></span>
                          <span style={sx`font-size:10.5px;color:rgba(255,255,255,.92);text-align:center;line-height:1.45`}>{it.label}</span>
                        </span>
                      ))}
                    </span>
                    <span style={sx`align-self:flex-start;height:34px;display:flex;align-items:center;padding:0 14px;border-radius:8px;background:#C9A24B;color:#1E1B18;font-size:12.5px;font-weight:800`}>عرض البكج ←</span>
                  </span>
                </a>
              </div>
              <div style={sx`display:flex;flex-direction:column;gap:9px;padding:15px 16px 17px;flex:1`}>
                <a href={k.href} onClick={k.go} className="hv-teal-text" style={sx`font-size:15px;font-weight:700;line-height:1.55;color:#1E1B18;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:46px`}>{k.name}</a>
                <div style={sx`display:flex;align-items:center;gap:5px;font-size:12px;color:#7C766D`}><span style={sx`color:#C9A24B;font-size:13px`}>★</span><span style={sx`font-weight:600;color:#1E1B18`}>{k.ratingText}</span><span>{k.reviewsText}</span></div>
                <div style={sx`display:flex;align-items:baseline;gap:8px;margin-top:auto`}>
                  <span style={sx`font-size:18px;font-weight:800;color:#1F4E4A`}>{k.priceText}</span>
                  {k.hasSale && <span style={sx`font-size:13px;color:#A39C90;text-decoration:line-through`}>{k.oldText}</span>}
                </div>
                <button type="button" onClick={k.add} className="hv-teal-dark" style={sx`margin-top:4px;height:42px;border-radius:10px;border:1px solid #1F4E4A;background:#1F4E4A;color:#fff;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;transition:background .18s ease`}>أضف البكج إلى العربة</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0;animation:fadeUp .45s ease both`}>
        <div style={sx`display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px`}>
          <a href="#/offers" style={sx`position:relative;overflow:hidden;border-radius:16px;padding:34px;min-height:180px;display:flex;flex-direction:column;justify-content:center;gap:8px;background:linear-gradient(120deg,#1F4E4A,#2F6F68)`}>
            <span style={sx`font-size:12px;letter-spacing:.1em;color:#A9CBC5`}>عروض محدودة</span>
            <span style={sx`font-size:23px;font-weight:800;color:#fff;line-height:1.4`}>خصومات تصل إلى ٣٠٪<br />على مجموعة مختارة</span>
            <span style={sx`font-size:13.5px;color:#D8E7E4;font-weight:700`}>تسوّق العروض ←</span>
          </a>
          <a href="#/category/starter-kits" style={sx`position:relative;overflow:hidden;border-radius:16px;padding:34px;min-height:180px;display:flex;flex-direction:column;justify-content:center;gap:8px;background:linear-gradient(120deg,#3A2A22,#7A5233)`}>
            <span style={sx`font-size:12px;letter-spacing:.1em;color:#E4CFA8`}>للمبتدئين</span>
            <span style={sx`font-size:23px;font-weight:800;color:#fff;line-height:1.4`}>بكجات جاهزة تبدأ بها<br />مشروعك الحرفي</span>
            <span style={sx`font-size:13.5px;color:#F0E3CC;font-weight:700`}>اكتشف البكجات ←</span>
          </a>
        </div>
      </section>

      <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0;animation:fadeUp .45s ease both`}>
        <div style={sx`display:grid;grid-template-columns:var(--scG);gap:20px;align-items:stretch`}>
          <a href="#/category/silicone-molds" className="hv-sc-teal" style={sx`position:relative;border-radius:16px;overflow:hidden;background:linear-gradient(150deg,#1f4e4a,#3d7d75);padding:30px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;min-height:100%;aspect-ratio:auto;transition:transform .24s ease,box-shadow .24s ease`}>
            <span style={sx`position:absolute;inset:0;background:radial-gradient(120% 80% at 80% 10%,rgba(255,255,255,.16),transparent 60%)`}></span>
            <span style={sx`position:relative;font-size:12px;letter-spacing:.1em;color:#E4D6B4`}>قسم مميّز</span>
            <span style={sx`position:relative;font-size:26px;font-weight:800;color:#fff;line-height:1.4`}>أكبر تشكيلة قوالب سيليكون</span>
            <span style={sx`position:relative;font-size:13.5px;color:#CFE0DD;line-height:1.85;max-width:280px`}>أكثر من ٢٠٠ قالب للريزن والشمع والتيرازو بأسعار الجملة.</span>
            <span style={sx`position:relative;margin-top:8px;align-self:flex-start;height:46px;display:flex;align-items:center;padding:0 22px;border-radius:10px;background:#C9A24B;color:#1E1B18;font-size:13.5px;font-weight:800`}>تصفّح كل القوالب</span>
          </a>
          <div style={sx`display:flex;flex-direction:column;gap:16px;min-width:0`}>
            <div style={sx`display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid #E9E3DA;padding-bottom:12px`}>
              <h2 style={sx`margin:0;font-size:19px;font-weight:800`}>قوالب سيليكون</h2>
              <a href="#/category/silicone-molds" style={sx`font-size:13px;font-weight:700;white-space:nowrap`}>كل التشكيلة ←</a>
            </div>
            <div style={sx`display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:16px`}>
              {v.sc1Items.map((item) => <ProductCard key={item.id} p={item} />)}
            </div>
          </div>
        </div>
      </section>

      <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0;animation:fadeUp .45s ease both`}>
        <div style={sx`display:flex;align-items:center;gap:8px;border-bottom:1px solid #E9E3DA;margin-bottom:22px;flex-wrap:wrap`}>
          {v.homeTabs.map((t) => (
            <button key={t.label} type="button" onClick={t.pick} style={sx`position:relative;height:50px;padding:0 16px;border:0;background:transparent;font-size:16px;font-weight:${t.weight};color:${t.color};cursor:pointer`}>{t.label}<span style={sx`position:absolute;bottom:-1px;inset-inline:10px;height:2.5px;background:#C9A24B;transform:scaleX(${t.active});transition:transform .22s cubic-bezier(.22,.61,.36,1)`}></span></button>
          ))}
          <a href={v.homeTabHref} style={sx`margin-inline-start:auto;font-size:13.5px;font-weight:700;white-space:nowrap`}>عرض الكل ←</a>
        </div>
        <div style={sx`display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:18px`}>
          {v.homeTabItems.map((item) => <ProductCard key={item.id} p={item} />)}
        </div>
      </section>

      <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0;animation:fadeUp .45s ease both`}>
        <div style={sx`display:grid;grid-template-columns:var(--scG);gap:20px;align-items:stretch`}>
          <a href="#/category/clock-boards" className="hv-sc-clay" style={sx`position:relative;border-radius:16px;overflow:hidden;background:linear-gradient(150deg,#4a3527,#8a6237);padding:30px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;min-height:100%;transition:transform .24s ease,box-shadow .24s ease`}>
            <span style={sx`position:absolute;inset:0;background:radial-gradient(120% 80% at 80% 10%,rgba(255,255,255,.14),transparent 60%)`}></span>
            <span style={sx`position:relative;font-size:12px;letter-spacing:.1em;color:#E4D6B4`}>قسم مميّز</span>
            <span style={sx`position:relative;font-size:26px;font-weight:800;color:#fff;line-height:1.4`}>منتجات صناعة ساعات وجداريات الريزن</span>
            <span style={sx`position:relative;font-size:13.5px;color:#F0E3CC;line-height:1.85;max-width:280px`}>قواعد خشبية ومكائن ومستلزمات جاهزة للتنفيذ.</span>
            <span style={sx`position:relative;margin-top:8px;align-self:flex-start;height:46px;display:flex;align-items:center;padding:0 22px;border-radius:10px;background:#C9A24B;color:#1E1B18;font-size:13.5px;font-weight:800`}>تصفّح المنتجات</span>
          </a>
          <div style={sx`display:flex;flex-direction:column;gap:16px;min-width:0`}>
            <div style={sx`display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid #E9E3DA;padding-bottom:12px`}>
              <h2 style={sx`margin:0;font-size:19px;font-weight:800`}>أخشاب ومستلزمات ساعات الريزن</h2>
              <a href="#/category/clock-boards" style={sx`font-size:13px;font-weight:700;white-space:nowrap`}>كل التشكيلة ←</a>
            </div>
            <div style={sx`display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:16px`}>
              {v.sc2Items.map((item) => <ProductCard key={item.id} p={item} />)}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function TrustStrip({ v }: { v: View }) {
  return (
    <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0`}>
      <div style={sx`display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;background:#fff;border:1px solid #E9E3DA;border-radius:16px;padding:22px`}>
        {v.trustFeatures.map((t) => (
          <div key={t.title} style={sx`display:flex;align-items:center;gap:12px`}>
            <span style={sx`width:44px;height:44px;border-radius:12px;background:#F1F5F4;color:#1F4E4A;display:flex;align-items:center;justify-content:center;font-size:18px;flex:0 0 auto`}>{t.glyph}</span>
            <span style={sx`display:flex;flex-direction:column;gap:2px`}><strong style={sx`font-size:14px`}>{t.title}</strong><span style={sx`font-size:12.5px;color:#7C766D`}>{t.desc}</span></span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeBottom({ v }: { v: View }) {
  return (
    <>
      <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0`}>
        <div style={sx`display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:22px`}>
          <div style={sx`display:flex;flex-direction:column;gap:6px`}><span style={sx`font-size:12px;letter-spacing:.12em;color:#C9A24B;font-weight:700`}>من الورشة</span><h2 style={sx`margin:0;font-size:var(--h2);font-weight:800`}>أحدث المقالات</h2></div>
          <a href="#/blog" style={sx`font-size:13.5px;font-weight:700;white-space:nowrap`}>كل المقالات ←</a>
        </div>
        <div style={sx`display:grid;grid-template-columns:repeat(var(--art),minmax(0,1fr));gap:18px`}>
          {v.articles.map((a) => (
            <a key={a.slug} href={a.href} className="hv-lift" style={sx`display:flex;flex-direction:column;background:#fff;border:1px solid #E9E3DA;border-radius:14px;overflow:hidden;transition:transform .22s ease,box-shadow .22s ease`}>
              <span style={sx`aspect-ratio:16 / 10;background:${a.bg};display:block`}></span>
              <span style={sx`padding:15px 16px 18px;display:flex;flex-direction:column;gap:8px`}><span style={sx`font-size:11.5px;color:#C9A24B;font-weight:700`}>{a.cat}</span><strong style={sx`font-size:15px;line-height:1.6;color:#1E1B18`}>{a.title}</strong><span style={sx`font-size:11.5px;color:#9C958A`}>{a.date} · {a.read}</span></span>
            </a>
          ))}
        </div>
      </section>

      <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0`}>
        <div style={sx`text-align:center;display:flex;flex-direction:column;gap:6px;margin-bottom:20px`}><span style={sx`font-size:12px;letter-spacing:.12em;color:#C9A24B;font-weight:700`}>تابعنا</span><h2 style={sx`margin:0;font-size:var(--h2);font-weight:800`}>من إنستغرام</h2></div>
        <div style={sx`display:grid;grid-template-columns:repeat(var(--catcols),minmax(0,1fr));gap:10px`}>
          {v.instaTiles.map((g, i) => (
            <a key={i} href={v.instagram} target="_blank" rel="noopener" className="hv-reveal" style={sx`aspect-ratio:1 / 1;border-radius:12px;background:${g.bg};display:flex;align-items:center;justify-content:center;color:transparent;font-size:13px;font-weight:700;transition:color .22s ease`}>شاهد المزيد</a>
          ))}
        </div>
      </section>

      <section style={sx`max-width:1360px;margin:0 auto;padding:var(--sec) var(--pad) 0`}>
        <div style={sx`background:linear-gradient(120deg,#1F4E4A,#2F6F68);border-radius:18px;padding:clamp(28px,5vw,52px);display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px;align-items:center`}>
          <div style={sx`display:flex;flex-direction:column;gap:9px`}><h2 style={sx`margin:0;font-size:clamp(21px,3vw,28px);font-weight:800;color:#fff;line-height:1.45`}>اشترك في النشرة واحصل على خصم ١٠٪</h2><p style={sx`margin:0;font-size:14.5px;color:#D8E7E4;line-height:1.8`}>أدلة حرفية، منتجات جديدة، وعروض خاصة — رسالة واحدة كل أسبوعين، بدون إزعاج.</p></div>
          <form onSubmit={v.submitNewsletter} style={sx`display:flex;gap:10px;flex-wrap:wrap`}>
            <input type="email" value={v.news} onChange={v.setNews} placeholder="بريدك الإلكتروني" aria-label="بريدك الإلكتروني" style={sx`flex:1;min-width:200px;height:54px;border:0;border-radius:12px;padding:0 16px;font-size:14.5px;background:#fff`} />
            <button type="submit" className="hv-gold" style={sx`height:54px;padding:0 28px;border:0;border-radius:12px;background:#C9A24B;color:#1E1B18;font-size:14.5px;font-weight:800;cursor:pointer;transition:background .2s ease`}>اشترك</button>
          </form>
        </div>
      </section>
    </>
  );
}
