"""
Integration tests for Document Ingestion API:
Upload, Review, Field Edits, Duplicate Detection, Idempotent Confirmation, and Ownership Security.
"""
import io
import pytest
from decimal import Decimal
from datetime import datetime
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, Account, AccountType, Transaction, TransactionType
from app.core.security import create_access_token


@pytest.mark.asyncio
class TestIngestionAPI:
    async def test_bank_statement_upload_review_and_confirm(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        auth_headers: dict,
    ):
        headers = auth_headers

        # 1. Create an account for the user
        account = Account(
            owner_id=str(test_user.id),
            name="Primary Salary Account",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("10000.00"),
        )
        db_session.add(account)
        await db_session.flush()

        csv_content = (
            "Date,Description,Debit,Credit,Balance\n"
            "2026-10-18,Salary Direct Deposit,,75000.00,85000.00\n"
            "2026-10-19,Zepto Online Groceries,850.00,,84150.00\n"
        )

        # 2. Upload statement
        files = {"file": ("statement.csv", csv_content.encode("utf-8"), "text/csv")}
        data = {"account_id": account.id}
        resp = await async_client.post("/api/v1/ingestion/upload", headers=headers, data=data, files=files)
        assert resp.status_code == 201
        session_data = resp.json()
        assert session_data["detected_document_type"] == "bank_statement"
        assert session_data["total_items"] == 2
        session_id = session_data["session_id"]
        assert len(session_data["items"]) == 2

        # 3. Retrieve session
        get_resp = await async_client.get(f"/api/v1/ingestion/sessions/{session_id}", headers=headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["session_id"] == session_id

        # 4. User corrects/updates an item
        item_to_edit = session_data["items"][1]
        patch_resp = await async_client.patch(
            f"/api/v1/ingestion/sessions/{session_id}/items/{item_to_edit['id']}",
            headers=headers,
            json={"description": "Zepto Quick Commerce Delivery", "amount": 850.00},
        )
        assert patch_resp.status_code == 200
        updated_items = patch_resp.json()["items"]
        assert any(it["description"] == "Zepto Quick Commerce Delivery" for it in updated_items)

        # 5. Confirm import
        confirm_data = {
            "account_id": account.id,
            "idempotency_key": "idemp-key-test-001",
        }
        confirm_resp = await async_client.post(
            f"/api/v1/ingestion/sessions/{session_id}/confirm",
            headers=headers,
            json=confirm_data,
        )
        assert confirm_resp.status_code == 200
        assert confirm_resp.json()["imported_count"] == 2

        # 6. Idempotency test: repeating with same key should return cached response without creating duplicate transactions
        repeat_resp = await async_client.post(
            f"/api/v1/ingestion/sessions/{session_id}/confirm",
            headers=headers,
            json=confirm_data,
        )
        assert repeat_resp.status_code == 200
        assert repeat_resp.json()["imported_count"] == 2

    async def test_duplicate_detection_against_existing_manual_transaction(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        auth_headers: dict,
    ):
        headers = auth_headers

        account = Account(
            owner_id=str(test_user.id),
            name="Checking Account",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("5000.00"),
        )
        db_session.add(account)
        await db_session.flush()

        # Existing manual transaction: ₹850 at ABC Supermarket on Oct 18
        existing_tx = Transaction(
            owner_id=str(test_user.id),
            account_id=account.id,
            amount=Decimal("850.00"),
            currency="INR",
            transaction_type=TransactionType.EXPENSE,
            description="ABC Supermarket",
            transaction_date=datetime(2026, 10, 18),
            source="manual",
        )
        db_session.add(existing_tx)
        await db_session.flush()

        # Upload a statement containing "UPI/ABC SUPERMARKET" on Oct 18 for ₹850
        csv_content = (
            "Date,Description,Debit,Credit\n"
            "18/10/2026,UPI/ABC SUPERMARKET/9871,850.00,\n"
        )
        files = {"file": ("statement.csv", csv_content.encode("utf-8"), "text/csv")}
        data = {"account_id": account.id}
        resp = await async_client.post("/api/v1/ingestion/upload", headers=headers, data=data, files=files)
        assert resp.status_code == 201
        session_data = resp.json()
        item = session_data["items"][0]
        assert item["duplicate_status"] in ("exact_duplicate", "strong_duplicate")
        assert item["is_selected_for_import"] is False  # Safely pre-unselected
        assert session_data["duplicate_items"] == 1

    async def test_security_isolation_user_b_cannot_access_user_a_session(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        auth_headers: dict,
        other_auth_headers: dict,
    ):
        account = Account(
            owner_id=str(test_user.id),
            name="User A Account",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("1000.00"),
        )
        db_session.add(account)
        await db_session.flush()

        csv_content = "Date,Description,Debit,Credit\n2026-10-18,Test Store,500.00,\n"
        files = {"file": ("statement.csv", csv_content.encode("utf-8"), "text/csv")}
        resp = await async_client.post(
            "/api/v1/ingestion/upload",
            headers=auth_headers,
            data={"account_id": account.id},
            files=files,
        )
        assert resp.status_code == 201
        session_id = resp.json()["session_id"]

        # User B attempts to view User A's session
        b_get = await async_client.get(
            f"/api/v1/ingestion/sessions/{session_id}",
            headers=other_auth_headers,
        )
        assert b_get.status_code == 404

        # User B attempts to confirm User A's session
        b_conf = await async_client.post(
            f"/api/v1/ingestion/sessions/{session_id}/confirm",
            headers=other_auth_headers,
            json={"account_id": account.id, "idempotency_key": "b-key"},
        )
        assert b_conf.status_code == 400 or b_conf.status_code == 404

    async def test_cancel_session_prevents_subsequent_confirmation(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        test_user: User,
        auth_headers: dict,
    ):
        headers = auth_headers

        account = Account(
            owner_id=str(test_user.id),
            name="Checking Account",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("5000.00"),
        )
        db_session.add(account)
        await db_session.flush()

        csv_content = "Date,Description,Debit,Credit\n2026-10-18,Test Store,500.00,\n"
        files = {"file": ("statement.csv", csv_content.encode("utf-8"), "text/csv")}
        resp = await async_client.post("/api/v1/ingestion/upload", headers=headers, data={"account_id": account.id}, files=files)
        session_id = resp.json()["session_id"]

        # Cancel session
        cancel_resp = await async_client.post(f"/api/v1/ingestion/sessions/{session_id}/cancel", headers=headers)
        assert cancel_resp.status_code == 200

        # Attempt to confirm cancelled session
        confirm_resp = await async_client.post(
            f"/api/v1/ingestion/sessions/{session_id}/confirm",
            headers=headers,
            json={"account_id": account.id, "idempotency_key": "key-cancelled"},
        )
        assert confirm_resp.status_code in (400, 404)

