import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/health/`);
    const j = await r.json();
    res.status(200).json({ frontend: "ok", backend: j });
  } catch (e) {
    res.status(500).json({ frontend: "ok", backend: "fail" });
  }
}
