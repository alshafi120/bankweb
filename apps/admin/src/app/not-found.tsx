import Link from "next/link";
import "./globals.css";

export default function NotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="grid min-h-dvh place-items-center bg-bg p-6 text-center font-sans">
        <div>
          <p className="text-5xl font-bold text-brand-700">404</p>
          <p className="mt-2 text-muted">الصفحة غير موجودة · Page not found</p>
          <Link href="/ar" className="mt-4 inline-block rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white">لوحة التحكم · Dashboard</Link>
        </div>
      </body>
    </html>
  );
}
