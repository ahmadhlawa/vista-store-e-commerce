import { useCallback, useEffect, useRef, useState } from "react";
import sx from "../../sx.js";
import { adminApi } from "../../api/adminApi.js";
import {
  Button,
  ConfirmDialog,
  Notice,
  PageHeader,
  Pagination,
  Spinner,
  card,
  useFeedback,
} from "../ui.jsx";

export default function MediaPage() {
  const feedback = useFeedback();
  const fileRef = useRef(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listMedia({ page, page_size: 24 });
      setItems(result.items);
      setPages(result.pages);
    } catch (error) {
      feedback.error(error.message || "تعذّر تحميل الملفات.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await adminApi.uploadMedia(file);
      feedback.success("تم رفع الملف.");
      setPage(1);
      await load();
    } catch (error) {
      feedback.error(error.message || "تعذّر رفع الملف.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async () => {
    const asset = confirming;
    setConfirming(null);
    try {
      await adminApi.deleteMedia(asset.id);
      feedback.success("تم حذف الملف.");
      await load();
    } catch (error) {
      feedback.error(error.message || "تعذّر حذف الملف.");
    }
  };

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      feedback.error("تعذّر النسخ — انسخ الرابط يدوياً.");
    }
  };

  return (
    <>
      <PageHeader
        title="الوسائط"
        description="مكتبة صور المتجر. تُختار هذه الصور مباشرة من حقول الصور في لوحة الإدارة، ويبقى نسخ الرابط متاحاً عند الحاجة."
        actions={
          <>
            <input ref={fileRef} type="file" accept="image/*" onChange={upload} style={sx`display:none`} />
            <Button disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "جارٍ الرفع…" : "رفع صورة"}
            </Button>
          </>
        }
      />
      {feedback.node}
      <Notice>الأنواع المسموحة: JPEG و PNG و WebP و GIF و ICO، بحد أقصى ٥ ميغابايت.</Notice>

      <div style={card}>
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <p style={sx`padding:36px;text-align:center;color:#7C766D;font-size:14px`}>لم تُرفع أي ملفات بعد.</p>
        ) : (
          <div style={sx`display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px`}>
            {items.map((asset) => (
              <div key={asset.id} style={sx`border:1px solid #E4E0D9;border-radius:12px;overflow:hidden;display:flex;flex-direction:column`}>
                <span style={sx`aspect-ratio:1 / 1;background:url("${asset.url}") center/cover no-repeat;background-color:#F2EFE9`}></span>
                <div style={sx`padding:10px;display:flex;flex-direction:column;gap:8px`}>
                  <span style={sx`font-size:12px;color:#7C766D;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`}>{asset.original_filename}</span>
                  <span style={sx`font-size:11.5px;color:#9C958A`}>{Math.round(asset.size_bytes / 1024)} كيلوبايت</span>
                  <Button variant="secondary" style={sx`min-height:34px;font-size:12.5px`} onClick={() => copy(asset.url)}>
                    {copied === asset.url ? "تم النسخ ✓" : "نسخ الرابط"}
                  </Button>
                  <Button variant="danger" style={sx`min-height:34px;font-size:12.5px`} onClick={() => setConfirming(asset)}>حذف</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Pagination page={page} pages={pages} onChange={setPage} />

      {confirming && (
        <ConfirmDialog
          title="تأكيد الحذف"
          message={`سيُحذف الملف «${confirming.original_filename}» نهائياً. تأكد من أنه غير مستخدم في أي منتج.`}
          onConfirm={remove}
          onCancel={() => setConfirming(null)}
        />
      )}
    </>
  );
}
