import json, urllib.request, time
def chat(model, messages, **extra):
    body = {"model": model, "messages": messages, "stream": False, "options": {"temperature": 0.2, "seed": 7}, **extra}
    req = urllib.request.Request("http://localhost:11434/api/chat", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    t = time.time(); r = json.load(urllib.request.urlopen(req, timeout=600)); r["_wall"] = time.time() - t
    return r
prompt = [{"role": "user", "content": "Explain in about 120 words why a small business might run an AI model on its own computer instead of a cloud API."}]
models = ["llama3.2:3b", "qwen3:4b-instruct-2507-q4_K_M", "gpt-oss:20b", "qwen3:30b-a3b-instruct-2507-q4_K_M"]
for m in models:
    chat(m, [{"role": "user", "content": "hi"}], keep_alive="10m")  # warm load
    rs = [chat(m, prompt, keep_alive="10m") for _ in range(2)]
    tps = [r["eval_count"] / (r["eval_duration"] / 1e9) for r in rs]
    ptps = [r["prompt_eval_count"] / (r["prompt_eval_duration"] / 1e9) for r in rs if r.get("prompt_eval_duration")]
    print(json.dumps({"model": m, "gen_tok_s": round(sum(tps)/len(tps), 1), "tokens": rs[-1]["eval_count"], "wall_s": round(rs[-1]["_wall"], 1), "prompt_tok_s": round(sum(ptps)/len(ptps), 1) if ptps else None}))
    chat(m, [{"role": "user", "content": "bye"}], keep_alive=0)
