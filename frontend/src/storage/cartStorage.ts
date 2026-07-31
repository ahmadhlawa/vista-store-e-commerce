import type { CartItem } from "../types/commerce";
import { readArray, writeArray } from "./safeStorage";

const key = "commerce_template_cart";
export const isCartItem = (value: unknown): value is CartItem => typeof value === "object" && value !== null && typeof (value as { key?: unknown }).key === "string";
export const cartStorage = { load: () => readArray(key, isCartItem), save: (items: readonly CartItem[]) => writeArray(key, items) };
