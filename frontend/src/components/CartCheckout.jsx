import sx from "../sx.js";
import A from "../utils/A.jsx";

export function CartPage({ v }) {
  return (
    <section style={sx`max-width:1360px;margin:0 auto;padding:26px var(--pad) 60px`}>
      <h1 style={sx`margin:0 0 4px;font-size:var(--h1);font-weight:800`}>عربة التسوّق</h1>
      <p style={sx`margin:0 0 22px;font-size:14px;color:#7C766D`}>{v.cartLineText}</p>
      {v.cartEmpty && (
        <div style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:16px;padding:70px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px`}>
          <span style={sx`width:72px;height:72px;border-radius:50%;background:#F4F1EC;display:flex;align-items:center;justify-content:center;font-size:28px;color:#A39C90`}>☹</span>
          <h2 style={sx`margin:6px 0 0;font-size:20px;font-weight:800`}>عربتك فارغة</h2>
          <p style={sx`margin:0;font-size:14px;color:#7C766D`}>ابدأ بتصفّح الأقسام واختر ما يناسب مشروعك.</p>
          <A href="/shop" style={sx`margin-top:8px;height:48px;display:flex;align-items:center;padding:0 26px;border-radius:11px;background:#1F4E4A;color:#fff;font-size:14.5px;font-weight:800`}>تصفّح المتجر</A>
        </div>
      )}
      {v.cartHasItems && (
        <div style={sx`display:grid;grid-template-columns:var(--shop);gap:24px;align-items:start;direction:rtl`}>
          <div style={sx`grid-column:1;display:flex;flex-direction:column;gap:12px;order:2`}>
            {v.cartRows.map((i) => (
              <div key={i.key} style={sx`display:flex;gap:14px;background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:14px;align-items:center;flex-wrap:wrap`}>
                <span style={sx`width:88px;height:88px;border-radius:11px;background:${i.bg};flex:0 0 auto`}></span>
                <div style={sx`display:flex;flex-direction:column;gap:5px;flex:1;min-width:160px`}>
                  <A href={i.href} style={sx`font-size:14.5px;font-weight:700;color:#1E1B18`}>{i.name}</A>
                  <span style={sx`font-size:12.5px;color:#9C958A`}>{i.varText}</span>
                  <span style={sx`font-size:13px;color:#7C766D`}>سعر القطعة: <strong style={sx`color:#1F4E4A`}>{i.unitText}</strong></span>
                </div>
                <div style={sx`display:flex;align-items:center;border:1px solid #E1DACE;border-radius:10px;height:44px;background:#FBF9F6`}>
                  <button type="button" onClick={i.dec} aria-label="إنقاص" style={sx`width:40px;height:100%;border:0;background:transparent;font-size:18px;cursor:pointer;color:#4A453E`}>−</button>
                  <span style={sx`width:36px;text-align:center;font-weight:800;font-size:14px`}>{i.qty}</span>
                  <button type="button" onClick={i.inc} aria-label="زيادة" style={sx`width:40px;height:100%;border:0;background:transparent;font-size:18px;cursor:pointer;color:#4A453E`}>+</button>
                </div>
                <strong style={sx`font-size:16px;color:#1E1B18;min-width:90px;text-align:end`}>{i.lineText}</strong>
                <button type="button" onClick={i.remove} aria-label="إزالة المنتج" className="hv-danger" style={sx`width:40px;height:40px;border:1px solid #E9E3DA;border-radius:10px;background:#fff;color:#A39C90;cursor:pointer;font-size:15px`}>✕</button>
              </div>
            ))}
            <A href="/shop" style={sx`align-self:flex-start;margin-top:6px;font-size:13.5px;font-weight:700`}>→ متابعة التسوّق</A>
          </div>
          <aside style={sx`grid-column:2;order:1;position:sticky;top:150px;background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:12px`}>
            <h2 style={sx`margin:0 0 4px;font-size:16px;font-weight:800`}>ملخّص الطلب</h2>
            <div style={sx`display:flex;justify-content:space-between;font-size:14px;color:#4A453E`}><span>المجموع الفرعي</span><strong>{v.subtotalText}</strong></div>
            {v.hasDiscount && <div style={sx`display:flex;justify-content:space-between;font-size:14px;color:#2E7D5B`}><span>الخصم ({v.couponLabel})</span><strong>−{v.discountText}</strong></div>}
            <div style={sx`display:flex;justify-content:space-between;font-size:14px;color:#4A453E`}><span>الشحن</span><strong style={sx`font-size:12.5px;font-weight:600;color:#7C766D`}>{v.shippingText}</strong></div>
            <div style={sx`display:flex;gap:8px;margin-top:4px`}>
              <input type="text" value={v.coupon} onChange={v.onCoupon} placeholder="كود الخصم" aria-label="كود الخصم" style={sx`flex:1;height:44px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 12px;font-size:13px`} />
              <button type="button" onClick={v.applyCoupon} className="hv-fill-teal" style={sx`height:44px;padding:0 16px;border:1px solid #1F4E4A;border-radius:10px;background:#fff;color:#1F4E4A;font-size:13px;font-weight:800;cursor:pointer`}>تطبيق</button>
            </div>
            {v.couponMsg && <span role="status" style={sx`font-size:12.5px;color:${v.couponMsgColor}`}>{v.couponMsg}</span>}
            <div style={sx`border-top:1px solid #F0EBE3;margin-top:6px;padding-top:12px;display:flex;justify-content:space-between;align-items:baseline`}><span style={sx`font-size:15px;font-weight:800`}>الإجمالي</span><strong style={sx`font-size:23px;color:#1F4E4A`}>{v.totalText}</strong></div>
            <A href="/checkout" className="hv-teal-dark" style={sx`height:52px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:#1F4E4A;color:#fff;font-size:15px;font-weight:800;transition:background .2s ease`}>إتمام الطلب</A>
            <span style={sx`font-size:12px;color:#9C958A;text-align:center`}>{v.freeShipHint}</span>
          </aside>
        </div>
      )}
    </section>
  );
}

export function CheckoutPage({ v }) {
  return (
    <section style={sx`max-width:1100px;margin:0 auto;padding:26px var(--pad) 60px`}>
      <h1 style={sx`margin:0 0 22px;font-size:var(--h1);font-weight:800`}>إتمام الطلب</h1>
      {v.checkoutEmpty ? (
        <div style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:16px;padding:60px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px`}>
          <h2 style={sx`margin:0;font-size:20px;font-weight:800`}>لا توجد منتجات لإتمام الطلب</h2>
          <A href="/shop" style={sx`margin-top:8px;height:48px;display:flex;align-items:center;padding:0 26px;border-radius:11px;background:#1F4E4A;color:#fff;font-size:14.5px;font-weight:800`}>تصفّح المتجر</A>
        </div>
      ) : (
        <div style={sx`display:grid;grid-template-columns:var(--pdp);gap:24px;align-items:start`}>
          <form onSubmit={v.placeOrder} style={sx`display:flex;flex-direction:column;gap:18px`}>
            <div style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:14px`}>
              <h2 style={sx`margin:0;font-size:16px;font-weight:800`}>بيانات العميل</h2>
              <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>الاسم الكامل
                <input type="text" value={v.ck.name} onChange={v.setName} placeholder="مثال: سارة أحمد" style={sx`height:48px;border:1px solid ${v.err.nameBorder};border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400`} />
                {v.err.name && <span style={sx`font-size:12px;color:#C0392B;font-weight:600`}>{v.err.name}</span>}
              </label>
              <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>رقم الهاتف
                <input type="tel" value={v.ck.phone} onChange={v.setPhone} placeholder="05XXXXXXXX" dir="ltr" style={sx`height:48px;border:1px solid ${v.err.phoneBorder};border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400;text-align:right`} />
                {v.err.phone && <span style={sx`font-size:12px;color:#C0392B;font-weight:600`}>{v.err.phone}</span>}
              </label>
              <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>البريد الإلكتروني (اختياري)
                <input type="email" value={v.ck.email} onChange={v.setEmail} placeholder="you@example.com" dir="ltr" style={sx`height:48px;border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400;text-align:right`} />
              </label>
              <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>منطقة التوصيل
                <select value={v.ck.areaId ?? ""} onChange={v.setArea} style={sx`height:48px;border:1px solid ${v.err.areaBorder};border-radius:10px;background:#FBF9F6;padding:0 13px;font-size:14px;font-weight:400;cursor:pointer`}>
                  <option value="">اختر المنطقة…</option>
                  {v.areas.map((a) => <option key={a.id} value={a.id}>{a.optionLabel}</option>)}
                </select>
                {v.err.area && <span style={sx`font-size:12px;color:#C0392B;font-weight:600`}>{v.err.area}</span>}
              </label>
              <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>العنوان بالتفصيل
                <textarea value={v.ck.address} onChange={v.setAddress} rows="3" placeholder="الشارع، رقم البناية، أقرب معلم" style={sx`border:1px solid ${v.err.addressBorder};border-radius:10px;background:#FBF9F6;padding:12px 13px;font-size:14px;font-weight:400;resize:vertical`}></textarea>
                {v.err.address && <span style={sx`font-size:12px;color:#C0392B;font-weight:600`}>{v.err.address}</span>}
              </label>
              <label style={sx`display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600`}>ملاحظات على الطلب (اختياري)
                <textarea value={v.ck.notes} onChange={v.setNotes} rows="2" placeholder="أي تفاصيل تساعدنا في التوصيل" style={sx`border:1px solid #E1DACE;border-radius:10px;background:#FBF9F6;padding:12px 13px;font-size:14px;font-weight:400;resize:vertical`}></textarea>
              </label>
            </div>
            <div style={sx`background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:12px`}>
              <h2 style={sx`margin:0;font-size:16px;font-weight:800`}>طريقة الدفع</h2>
              {v.payments.map((p) => (
                <label key={p.key} style={sx`display:flex;align-items:center;gap:11px;border:1.5px solid ${p.border};background:${p.bg};border-radius:11px;padding:14px;cursor:pointer;transition:border-color .18s ease,background .18s ease`}>
                  <input type="radio" name="pay" checked={p.checked} onChange={p.pick} style={sx`width:17px;height:17px;accent-color:#1F4E4A;cursor:pointer`} />
                  <span style={sx`display:flex;flex-direction:column;gap:2px`}><strong style={sx`font-size:14px`}>{p.label}</strong><span style={sx`font-size:12.5px;color:#7C766D`}>{p.desc}</span></span>
                </label>
              ))}
              <label style={sx`display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#4A453E;cursor:pointer;margin-top:4px`}><input type="checkbox" checked={v.ck.terms} onChange={v.setTerms} style={sx`width:17px;height:17px;accent-color:#1F4E4A;margin-top:2px;cursor:pointer`} /><span>أوافق على <A href="/page/terms">الشروط والأحكام</A> و<A href="/page/return-policy">سياسة الإرجاع</A></span></label>
              {v.err.terms && <span style={sx`font-size:12px;color:#C0392B;font-weight:600`}>{v.err.terms}</span>}
            </div>
            {v.submitError && <div role="alert" style={sx`background:#FBF1EF;border:1px solid #E7CFC9;border-radius:12px;padding:14px;color:#8C2F22;font-size:13.5px`}>{v.submitError}</div>}
            <button type="submit" disabled={v.placing} style={sx`height:54px;border:0;border-radius:12px;background:#1F4E4A;color:#fff;font-size:15.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;opacity:${v.placingOpacity}`}>
              {v.placing && <span style={sx`width:17px;height:17px;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:block`}></span>}
              {v.placeLabel}
            </button>
          </form>
          <aside style={sx`position:sticky;top:150px;background:#fff;border:1px solid #E9E3DA;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:11px`}>
            <h2 style={sx`margin:0 0 4px;font-size:16px;font-weight:800`}>ملخّص الطلب</h2>
            {v.cartRows.map((i) => (
              <div key={i.key} style={sx`display:flex;gap:10px;align-items:center;padding-bottom:10px;border-bottom:1px solid #F5F1EA`}>
                <span style={sx`width:52px;height:52px;border-radius:9px;background:${i.bg};flex:0 0 auto`}></span>
                <span style={sx`display:flex;flex-direction:column;gap:2px;min-width:0;flex:1`}><span style={sx`font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`}>{i.name}</span><span style={sx`font-size:12px;color:#9C958A`}>×{i.qty}</span></span>
                <strong style={sx`font-size:13.5px`}>{i.lineText}</strong>
              </div>
            ))}
            <div style={sx`display:flex;justify-content:space-between;font-size:13.5px;color:#4A453E`}><span>المجموع الفرعي</span><strong>{v.ckSubtotalText}</strong></div>
            {v.ckHasDiscount && <div style={sx`display:flex;justify-content:space-between;font-size:13.5px;color:#2E7D5B`}><span>الخصم</span><strong>−{v.ckDiscountText}</strong></div>}
            <div style={sx`display:flex;justify-content:space-between;font-size:13.5px;color:#4A453E`}><span>الشحن {v.areaName && `(${v.areaName})`}</span><strong>{v.ckShippingText}</strong></div>
            <div style={sx`border-top:1px solid #F0EBE3;padding-top:11px;display:flex;justify-content:space-between;align-items:baseline`}><span style={sx`font-size:15px;font-weight:800`}>الإجمالي</span><strong style={sx`font-size:22px;color:#1F4E4A`}>{v.ckTotalText}</strong></div>
            <span style={sx`font-size:11.5px;color:#9C958A;line-height:1.7`}>{v.pricingNote}</span>
          </aside>
        </div>
      )}
    </section>
  );
}
