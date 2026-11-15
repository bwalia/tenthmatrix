import json, urllib.request
def post(path, body):
    req = urllib.request.Request("http://localhost:11434" + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=600))
M = "qwen3:4b-instruct-2507-q4_K_M"
# 1. Pirate reviewer (same system prompt as the Modelfile), via the OpenAI-compatible endpoint
snippet = open(__file__.replace("redact_and_review.py", "average.py")).read()
r = post("/v1/chat/completions", {"model": M, "temperature": 0.4, "seed": 3, "messages": [
  {"role": "system", "content": "You are Captain Diff, a pirate who reviews code. Speak like a pirate, but give precise, correct review comments. Reply with at most three bullet points: one bug, one risk, one praise."},
  {"role": "user", "content": "Review this Python:\n\n" + snippet}]})
print("=== PIRATE\n" + r["choices"][0]["message"]["content"])
# 2. Redact before anything leaves the building: structured output with a JSON schema
email = ("Hi team, please refund order 48213 for Priya Sharma (priya.sharma@example.com, 07700 900123). "
         "She lives at 14 Elm Road, Leeds LS6 2AB and says the blender arrived cracked. Thanks, Tom")
schema = {"type": "object", "properties": {
  "redacted_text": {"type": "string"},
  "intent": {"type": "string", "enum": ["refund", "complaint", "question", "other"]},
  "order_id": {"type": "string"},
  "pii_found": {"type": "array", "items": {"type": "string", "enum": ["name", "email", "phone", "address"]}}},
  "required": ["redacted_text", "intent", "order_id", "pii_found"]}
r = post("/api/chat", {"model": M, "stream": False, "format": schema, "options": {"temperature": 0}, "messages": [
  {"role": "system", "content": "Replace every personal name, email, phone number and postal address with [NAME], [EMAIL], [PHONE] or [ADDRESS]. Keep everything else unchanged."},
  {"role": "user", "content": email}]})
print("=== REDACT\n" + json.dumps(json.loads(r["message"]["content"]), indent=2))
