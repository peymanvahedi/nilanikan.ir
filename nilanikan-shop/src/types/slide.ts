export type Slide = {
  id: number | string;
  image: string;        // URL کامل تصویر بک‌اند (مثلاً http://.../media/...)
  target_url?: string;  // لینک مقصد (محصول/URL دلخواه)
  title?: string;
};
