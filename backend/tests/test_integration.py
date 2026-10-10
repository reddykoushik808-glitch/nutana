import pytest
from bson import ObjectId
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)

class FakeCollection:
    def __init__(self, name):
        self.name = name
        self.docs = []

    def insert_one(self, doc):
        d = doc.copy()
        if "_id" not in d:
            d["_id"] = ObjectId()
        self.docs.append(d)
        class Res:
            inserted_id = d["_id"]
        return Res()

    def find_one(self, query):
        for d in self.docs:
            match = True
            for k, v in query.items():
                if k == "_id" and str(d.get("_id")) == str(v):
                    continue
                if d.get(k) != v:
                    match = False
                    break
            if match:
                return d
        return None

    def find(self, query=None):
        class Cursor:
            def __init__(self, docs):
                self._docs = docs
            def sort(self, *args, **kwargs):
                return self
            def skip(self, n):
                return self
            def limit(self, n):
                return self
            def __iter__(self):
                return iter(self._docs)
        if not query:
            return Cursor(self.docs)
        filtered = []
        for d in self.docs:
            match = True
            for k, v in query.items():
                if k == "shop_id" and d.get("shop_id") != v:
                    match = False
                elif k == "_id" and str(d.get("_id")) != str(v):
                    match = False
            if match:
                filtered.append(d)
        return Cursor(filtered)

    def count_documents(self, query):
        return len(list(self.find(query)))

    def update_one(self, query, update):
        # find matching doc
        target = None
        for d in self.docs:
            match = True
            for k, v in query.items():
                if k == "_id" and str(d.get("_id")) == str(v):
                    continue
                if isinstance(v, dict):
                    if "$gte" in v and d.get(k, 0) < v["$gte"]:
                        match = False
                        break
                elif d.get(k) != v:
                    match = False
                    break
            if match:
                target = d
                break

        if target:
            if "$set" in update:
                target.update(update["$set"])
            if "$inc" in update:
                for k, v in update["$inc"].items():
                    target[k] = target.get(k, 0) + v
            class Res:
                modified_count = 1
            return Res()
        class Res:
            modified_count = 0
        return Res()

class FakeDB:
    def __init__(self):
        self.users = FakeCollection("users")
        self.shops = FakeCollection("shops")
        self.products = FakeCollection("products")
        self.inventory_batches = FakeCollection("inventory_batches")
        self.sales = FakeCollection("sales")
        self.stock_movements = FakeCollection("stock_movements")
        self.recommendations = FakeCollection("recommendations")
        self.exchanges = FakeCollection("exchanges")
        self.purchase_orders = FakeCollection("purchase_orders")
        self.feedback = FakeCollection("feedback")
        self.audit_logs = FakeCollection("audit_logs")

    def command(self, *args, **kwargs):
        return {"ok": 1}

@pytest.fixture(autouse=True)
def mock_db_fixture(monkeypatch):
    fake = FakeDB()
    monkeypatch.setattr("app.db.client.get_database", lambda: fake)
    monkeypatch.setattr("app.api.dependencies.get_database", lambda: fake)
    return fake

def test_full_auth_and_shop_isolation(mock_db_fixture):
    # 1. Register Shop A
    reg_a = client.post("/api/v1/auth/register", json={
        "name": "Owner A",
        "email": "ownera@store.com",
        "password": "password123",
        "shop_name": "Store A",
        "shop_type": "Kirana Store",
        "phone": "+91 99999 11111"
    })
    assert reg_a.status_code == 201
    data_a = reg_a.json()
    token_a = data_a["token"]
    shop_a_id = data_a["shop"]["id"]

    # 2. Register Shop B
    reg_b = client.post("/api/v1/auth/register", json={
        "name": "Owner B",
        "email": "ownerb@store.com",
        "password": "password123",
        "shop_name": "Store B",
        "shop_type": "Kirana Store",
        "phone": "+91 88888 22222"
    })
    assert reg_b.status_code == 201
    data_b = reg_b.json()
    token_b = data_b["token"]
    shop_b_id = data_b["shop"]["id"]

    # Ensure Shop IDs are distinct
    assert shop_a_id != shop_b_id

    # 3. Shop A creates a product
    prod_res = client.post(
        "/api/v1/products",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "name": "Amul Milk 1L",
            "category": "Dairy",
            "unit": "packet",
            "selling_price": 32.0,
            "minimum_stock_threshold": 5.0
        }
    )
    assert prod_res.status_code == 201
    prod_a_id = prod_res.json()["id"]

    # 4. Verify Shop B cannot see Shop A's products
    list_b = client.get("/api/v1/products", headers={"Authorization": f"Bearer {token_b}"})
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0

    # 5. Shop A adds a fresh batch
    batch_res = client.post(
        f"/api/v1/products/{prod_a_id}/batches",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "quantity_received": 10.0,
            "unit_purchase_cost": 26.0,
            "batch_number": "BATCH-01"
        }
    )
    assert batch_res.status_code == 201
    assert batch_res.json()["quantity_available"] == 10.0

    # 6. Shop A executes a sale deducting stock via FEFO
    sale_res = client.post(
        "/api/v1/sales",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "line_items": [
                {
                    "product_id": prod_a_id,
                    "quantity": 3.0,
                    "unit_selling_price": 32.0,
                    "discount": 0.0
                }
            ]
        }
    )
    assert sale_res.status_code == 201
    sale_data = sale_res.json()
    assert sale_data["net_total"] == 96.0

    # 7. Oversell prevention test: Attempt to sell more than remaining (10 - 3 = 7 available)
    oversell_res = client.post(
        "/api/v1/sales",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "line_items": [
                {
                    "product_id": prod_a_id,
                    "quantity": 100.0,
                    "unit_selling_price": 32.0
                }
            ]
        }
    )
    assert oversell_res.status_code == 400

    # 8. Single service SPA fallback check: GET /dashboard returns index.html
    html_res = client.get("/dashboard")
    assert html_res.status_code == 200
    assert "NUTANA" in html_res.text or "html" in html_res.text.lower()
