export type Tone = "teal" | "sand" | "rose" | "cream" | "lilac" | "steel" | "olive" | "clay" | "mint" | "stone";
export interface ProductImage { background: string; alt?: string }
export interface ProductOption { label: string; value: string }
export interface ProductVariant { label: string; options: string[] }
export interface Category { id: number; slug: string; name: string; tone: Tone; featured: boolean; subs: string[]; desc?: string }
export interface Product { id: number; slug: string; name: string; category: string; categoryName: string; price: number; sale: number | null; sku: string; rating: number; reviews: number; stock: number; isNew: boolean; featured: boolean; bestSeller: boolean; bg: string; gallery: string[]; variation: ProductVariant | null; sub: string; short: string; specs: Array<[string, string]> }
export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "rating";
export interface ProductQuery { cats?: string[]; maxPrice?: number | null; onlyOffers?: boolean; inStock?: boolean; sort?: SortKey; q?: string }
export interface Brand { latin: string; ar: string; tagline: string }
export interface SocialLinks { instagram: string; facebook: string; tiktok: string; youtube: string }
export interface StoreSettings extends SocialLinks { brand: Brand; currency: string; phone: string; whatsapp: string; location: string; email: string; freeShippingOver: number; shippingFlat: number; announcement: string; hours: string }
export interface CartItem { key: string; id: number; slug: string; name: string; unit: number; bg: string; variation: string; qty: number }
export interface CartState { items: CartItem[] }
export type Coupon = { type: "percent"; value: number; label: string } | { type: "shipping"; value: number; label: string }
export interface CartTotals { subtotal: number; discount: number; shipping: number; total: number; coupon: Coupon | null }
export interface CustomerDetails { name: string; phone: string; city: number; address: string; notes: string }
export interface CheckoutData extends CustomerDetails { payment: "cod" | "card" | "transfer"; terms: boolean }
export interface DeliveryOption { id: number; name: string; price: number; eta: string }
export interface OrderDraft { customer: CheckoutData; items: CartItem[]; totals: { subtotal: number; discount: number; shipping: number; total: number } }
export interface SearchSuggestion { products: Product[]; cats: Category[] }
export interface Article { id: number; slug: string; title: string; excerpt: string; date: string; read: string; cat: string; author: string; tone: Tone; bg: string }
export interface StaticPage { title: string; lead: string; body: string[] }
export type TrackStep = [title: string, time: string, done: boolean]
export type TrackResult = { ok: false; error: string } | { ok: true; id: string; steps: TrackStep[] };
export interface Order { ok: true; id: string; eta: string; payload: OrderDraft }
