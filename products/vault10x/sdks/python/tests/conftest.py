"""Shared pytest fixtures for Vault10x Python SDK tests."""

from __future__ import annotations

import httpx
import pytest
import respx

from vault10x.client import Vault10xClient

ENDPOINT = "https://vault.test"
TOKEN = "s.test-jwt-token"
TENANT_ID = "00000000-0000-0000-0000-000000000001"


@pytest.fixture()
def mock_api() -> respx.MockRouter:
    """Return a started respx mock router scoped to a single test."""
    with respx.mock(base_url=ENDPOINT) as router:
        yield router


@pytest.fixture()
async def client(mock_api: respx.MockRouter) -> Vault10xClient:
    """Return a Vault10xClient configured against the test endpoint."""
    c = Vault10xClient(
        endpoint=ENDPOINT,
        token=TOKEN,
        tenant_id=TENANT_ID,
        max_retries=0,
    )
    yield c
    await c.aclose()
