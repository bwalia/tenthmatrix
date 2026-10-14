#!/usr/bin/env python3
"""Post a Slack Incoming Webhook message (no Docker; works on self-hosted runners)."""
import json
import os
import sys
import urllib.error
import urllib.request


def main() -> int:
    webhook = os.environ.get("SLACK_WEBHOOK", "").strip()
    if not webhook:
        print("SLACK_WEBHOOK not set; skipping Slack notification.")
        return 0

    status = os.environ.get("JOB_STATUS", "unknown")
    color_map = {
        "success": "good",
        "failure": "danger",
        "cancelled": "warning",
    }
    color = color_map.get(status, "#808080")

    title = os.environ.get("SLACK_TITLE", "GitHub Actions")
    message = os.environ.get("SLACK_MESSAGE", "")
    username = os.environ.get("SLACK_USERNAME", "TenthMatrix Pipeline")
    icon_url = os.environ.get("SLACK_ICON", "").strip()

    payload: dict = {
        "username": username,
        "attachments": [
            {
                "color": color,
                "title": title,
                "text": message,
                "footer": "GitHub Actions",
            }
        ],
    }
    if icon_url:
        payload["icon_url"] = icon_url

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        webhook,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            if resp.status != 200:
                print(f"Slack webhook HTTP {resp.status}: {body}", file=sys.stderr)
                return 1
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        print(f"Slack webhook HTTP error {e.code}: {err}", file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(f"Slack webhook URL error: {e}", file=sys.stderr)
        return 1

    print("Slack notification sent.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
