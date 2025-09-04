// src/app/api-test/page.tsx
import { get, endpoints } from "@/lib/api";

export default async function ApiTestPage() {
  const data = await get(endpoints.products); // DRF برمی‌گردونه
  const items = Array.isArray(data) ? data : data.results || [];

  return (
    <main style={{ padding: 24 }}>
      <h1>API Test: Products</h1>
      <p>Fetched: {items.length} item(s)</p>
      <ul>
        {items.map((p: any) => (
          <li key={p.id}>
            {p.name} — {p.price}
          </li>
        ))}
      </ul>
      <pre style={{ background:'#111', color:'#0f0', padding:12, overflow:'auto' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}
