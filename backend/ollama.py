import httpx
import json
from typing import AsyncGenerator

OLLAMA_BASE = "http://localhost:11434"


async def get_models() -> list[str]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{OLLAMA_BASE}/api/tags")
        resp.raise_for_status()
        data = resp.json()
        return [m["name"] for m in data.get("models", [])]


async def stream_chat(
    model: str,
    system_prompt: str,
    messages: list[dict],
) -> AsyncGenerator[str, None]:
    payload = {
        "model": model,
        "stream": True,
        "messages": [
            {"role": "system", "content": system_prompt},
            *messages
        ]
    }
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            f"{OLLAMA_BASE}/api/chat",
            json=payload
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        yield token
                    if chunk.get("done"):
                        break
                except json.JSONDecodeError:
                    continue
