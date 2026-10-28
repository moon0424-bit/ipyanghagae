// 입양하개 AI 서버 함수 (Vercel Serverless Function)
// 브라우저는 이 함수에 프롬프트만 보내고, API 키는 Vercel 환경변수(ANTHROPIC_API_KEY)에만 있다.

const MODEL = process.env.AI_MODEL || "claude-haiku-5-5"; // 빠르고 저렴한 Haiku 모델 (Vercel 환경변수 AI_MODEL로 바꿀 수 있음)
const MAX_TOKENS = 1500;          // 한 번 답변 길이 상한
const MAX_PROMPT_CHARS = 8000;    // 너무 긴 요청 차단
const PER_MINUTE = 6;             // 한 사람(IP)이 1분에 보낼 수 있는 요청 수
const PER_DAY_TOTAL = Number(process.env.DAILY_LIMIT || 300); // 서버 인스턴스당 하루 총 요청 상한

// 입양하개 화면에서 만든 세 가지 프롬프트만 허용 (다른 용도로 쓰이지 않게)
const ALLOWED_STARTS = [
  "너는 유기동물 보호소의 입양 공고 작성을 돕는다.",
  "너는 유기동물 입양 희망자의 자가 체크를 돕는다.",
  "너는 유기동물 보호소의 기존 입양 공고를 입양자가 이해하기 쉽게 정리한다.",
];

const hits = new Map();
let day = new Date().toDateString(), dayCount = 0;

function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  if (new Date().toDateString() !== day) { day = new Date().toDateString(); dayCount = 0; }
  dayCount++;
  return list.length > PER_MINUTE || dayCount > PER_DAY_TOTAL;
}

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;

  if (req.method === "GET") return res.status(200).json({ ready: Boolean(key) });
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!key) return res.status(503).json({ error: "no_key" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const prompt = String(body?.prompt || "");
  if (!prompt || prompt.length > MAX_PROMPT_CHARS || !ALLOWED_STARTS.some(s => prompt.startsWith(s))) {
    return res.status(400).json({ error: "bad_prompt" });
  }

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
  if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: "요청한 JSON 형식으로만 답한다. 설명이나 코드 블록 표시 없이 JSON 객체 하나만 출력한다.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      const msg = JSON.stringify(data?.error || {});
      console.error("Anthropic error", r.status, msg);
      if (r.status === 429) return res.status(429).json({ error: "rate_limited" });
      if (/credit|limit|billing/i.test(msg)) return res.status(402).json({ error: "budget" });
      return res.status(502).json({ error: "upstream" });
    }
    const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("");
    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "upstream" });
  }
}
