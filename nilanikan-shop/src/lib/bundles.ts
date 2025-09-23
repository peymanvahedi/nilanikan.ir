// src/lib/bundles.ts
import { get, endpoints } from "@/lib/api";

/**
 * گرفتن جزئیات یک باندل از بک‌اند
 * @param slugOrId  مثل st-shlor-dom-2530
 */
export async function fetchBundle(slugOrId: string) {
  return await get(`${endpoints.bundles}${encodeURIComponent(slugOrId)}/`, {
    throwOnHTTP: false,
    fallback: null,
  });
}
