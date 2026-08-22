import json, sys, urllib.request

SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5teXhlZndzcnR6aXNyd2Vrc29oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzIyOTg5NSwiZXhwIjoyMTAyODA1ODk1fQ.t1XduY_i_Efm0-df9AntLwZQEwm92FnMIdScic0DLhY"

req = urllib.request.Request(
    "https://nmyxefwsrtzisrweksoh.supabase.co/rest/v1/",
    headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
)
with urllib.request.urlopen(req, timeout=10) as resp:
    d = json.loads(resp.read().decode())

schemas = d.get("definitions", {})
for name in ("artifacts", "artifacts_public", "profiles"):
    if name not in schemas:
        continue
    print(f"--- {name} ---")
    for col, info in schemas[name].get("properties", {}).items():
        t = info.get("type", "?")
        f = info.get("format", "")
        en = info.get("enum")
        desc = info.get("description", "")[:60]
        en_s = f" enum={en}" if en else ""
        print(f"  {col:22} {t:8} {f:22}{en_s}  {desc}")
    reqs = schemas[name].get("required", [])
    if reqs:
        print("  required:", reqs)