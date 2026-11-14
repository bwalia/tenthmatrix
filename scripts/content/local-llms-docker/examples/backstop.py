import re

PATTERNS = {
    "[EMAIL]": r"[\w.+-]+@[\w-]+\.[\w.-]+",
    "[PHONE]": r"(?:\+44\s?7\d{3}|\b07\d{3})\s?\d{3}\s?\d{3}\b",
    "[POSTCODE]": r"\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b",
}

def backstop(text: str) -> tuple[str, list[str]]:
    """Second, deterministic pass after the model. Returns the text and what it had to fix."""
    fixed = []
    for tag, pattern in PATTERNS.items():
        text, n = re.subn(pattern, tag, text)
        if n:
            fixed.append(f"{tag} x{n}")
    return text, fixed

# What a model might hand back on a bad day: it missed the phone number and the postcode.
print(backstop("Refund order 48213 for [NAME] ([EMAIL], 07700 900123), [ADDRESS] LS6 2AB. Thanks, Tom"))
