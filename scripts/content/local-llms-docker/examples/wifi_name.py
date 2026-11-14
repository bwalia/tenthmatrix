import os
from openai import OpenAI

# Ollama: http://localhost:11434/v1   vLLM or NIM: http://localhost:8000/v1
client = OpenAI(base_url=os.getenv("LLM_BASE_URL", "http://localhost:11434/v1"), api_key="local")
model = os.getenv("LLM_MODEL", "llama3.2:3b")

reply = client.chat.completions.create(
    model=model,
    messages=[{"role": "user", "content": "Give our office Wi-Fi a funny, safe-for-work network name. Reply with the name only."}],
    temperature=0.9,
)
print(reply.choices[0].message.content)
