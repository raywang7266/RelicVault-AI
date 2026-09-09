# -*- coding: utf-8 -*-
"""验证智谱 GLM 是否支持一次传入多张图片（决定多图识图方案）。"""
import os
import base64
import json
import urllib.request
import urllib.error


def make_png(path, w, h, kind):
    """生成一张简单 PNG（纯标准库）。"""
    import zlib
    import struct
    rows = []
    for y in range(h):
        row = bytearray()
        row.append(0)
        for x in range(w):
            if kind == 0:
                c = (200, 60, 60)      # 红色调
            else:
                c = (60, 120, 200)     # 蓝色调
            row += bytes(c)
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    return base64.b64encode(png).decode("ascii")


out_dir = os.path.dirname(os.path.abspath(__file__))
b64_a = make_png(os.path.join(out_dir, "m_a.png"), 200, 200, 0)
b64_b = make_png(os.path.join(out_dir, "m_b.png"), 200, 200, 1)
print("img A base64 len:", len(b64_a), "| img B base64 len:", len(b64_b))

# 读取 .env.local 里的 key
key = None
env_path = os.path.join(out_dir, "..", ".env.local")
with open(env_path, "r", encoding="utf-8") as f:
    for line in f:
        if line.startswith("ZHIPU_API_KEY="):
            key = line.split("=", 1)[1].strip()
            break
if not key:
    print("NO KEY FOUND")
    raise SystemExit(1)

endpoint = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

# 多图：content 里放两个 image_url
body = {
    "model": "glm-4v-flash",
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "这里有两张图片。第一张是什么颜色？第二张是什么颜色？请用中文简短回答。"},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_a}"}},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_b}"}},
            ],
        }
    ],
    "max_tokens": 200,
}

data = json.dumps(body).encode("utf-8")
req = urllib.request.Request(
    endpoint,
    data=data,
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        print("HTTP:", resp.status)
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        print("MULTI-IMAGE RESULT:", content)
        print("=> 智谱支持多图输入" if content else "=> 返回为空")
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code)
    print("body:", e.read().decode("utf-8", errors="replace")[:800])
    print("=> 智谱多图可能不被支持")
except Exception as e:
    print("ERROR:", type(e).__name__, e)
