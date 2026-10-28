// 내 컴퓨터에서 미리 보기용 서버: npm run dev → http://localhost:3000
// public 폴더의 화면과 api/ai.js 를 Vercel과 같은 방식으로 실행한다.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import handler from "./api/ai.js";

const TYPES = { ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };
const PORT = 3000;

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/ai") {
    let raw = ""; for await (const c of req) raw += c;
    req.body = raw ? JSON.parse(raw) : {};
    res.status = code => { res.statusCode = code; return res; };
    res.json = obj => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); };
    return handler(req, res);
  }
  const file = normalize(join("public", url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname)));
  if (!file.startsWith("public")) { res.statusCode = 403; return res.end(); }
  try {
    const buf = await readFile(file);
    res.setHeader("content-type", TYPES[extname(file)] || "application/octet-stream");
    res.end(buf);
  } catch { res.statusCode = 404; res.end("Not found"); }
}).listen(PORT, () => console.log(`입양하개 실행 중 → http://localhost:${PORT}  (끄려면 Ctrl + C)`));
