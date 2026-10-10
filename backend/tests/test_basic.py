import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["app"] == "nutana"

def test_unauthorized_dashboard_access():
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 401
