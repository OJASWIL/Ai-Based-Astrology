# app/routes/payment.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.utils.token import get_current_user_id
from app.db import get_db
from datetime import datetime, timedelta
import os
import requests

payment_bp = Blueprint("payment", __name__)

ESEWA_STATUS_URL = os.environ.get(
    "ESEWA_STATUS_CHECK_URL",
    "https://rc-epay.esewa.com.np/api/epay/transaction/status/"
)

PLAN_DAYS = {
    "premium": 30,
    "annual":  365,
}


def save_payment_and_activate(user_id: int, tx_uuid: str, ref_id: str,
                               product_code: str, plan_name: str, amount: float):
    conn       = get_db()
    cur        = conn.cursor()
    plan_key   = plan_name.lower()
    days       = PLAN_DAYS.get(plan_key, 30)
    expires_at = datetime.utcnow() + timedelta(days=days)

    cur.execute(
        """
        INSERT INTO payments
            (user_id, transaction_uuid, ref_id, product_code, plan_name, amount, status)
        VALUES (%s, %s, %s, %s, %s, %s, 'COMPLETE')
        ON CONFLICT (transaction_uuid) DO NOTHING;
        """,
        (user_id, tx_uuid, ref_id, product_code, plan_name, amount),
    )

    cur.execute(
        """
        INSERT INTO user_premium (user_id, is_premium, premium_expires_at, updated_at)
        VALUES (%s, TRUE, %s, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
            is_premium         = TRUE,
            premium_expires_at = EXCLUDED.premium_expires_at,
            updated_at         = NOW();
        """,
        (user_id, expires_at),
    )

    conn.commit()
    cur.close()
    return expires_at


def get_premium_status(user_id: int) -> dict:
    conn = get_db()
    cur  = conn.cursor()

    cur.execute(
        "SELECT is_premium, premium_expires_at FROM user_premium WHERE user_id = %s;",
        (user_id,),
    )
    row = cur.fetchone()

    if not row or not row["is_premium"]:
        cur.close()
        return {"premium": False, "expires_at": None, "plan_name": None}

    expires_at = row["premium_expires_at"]

    if expires_at and datetime.utcnow() > expires_at:
        cur.execute(
            "UPDATE user_premium SET is_premium = FALSE WHERE user_id = %s;",
            (user_id,),
        )
        conn.commit()
        cur.close()
        return {"premium": False, "expires_at": None, "plan_name": None}

    cur.execute(
        "SELECT plan_name FROM payments WHERE user_id = %s ORDER BY created_at DESC LIMIT 1;",
        (user_id,),
    )
    payment_row = cur.fetchone()
    plan_name = payment_row["plan_name"] if payment_row else "Premium"

    cur.close()
    return {
        "premium":    True,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "plan_name":  plan_name,
    }


@payment_bp.route("/verify", methods=["POST"])
@jwt_required()
def verify_payment():
    user_id = get_current_user_id()
    data    = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No data received"}), 400

    transaction_uuid = data.get("transaction_uuid")
    total_amount     = data.get("total_amount")
    product_code     = data.get("product_code")
    plan_name        = data.get("plan_name", "Premium")

    if not all([transaction_uuid, total_amount, product_code]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        status_url = (
            f"{ESEWA_STATUS_URL}"
            f"?product_code={product_code}"
            f"&transaction_uuid={transaction_uuid}"
            f"&total_amount={total_amount}"
        )
        res = requests.get(status_url, timeout=10)
        if not res.ok:
            return jsonify({"success": False, "message": "eSewa status check failed"}), 502
        verify_data = res.json()
    except Exception as e:
        return jsonify({"error": f"eSewa check error: {str(e)}"}), 500

    if verify_data.get("status") != "COMPLETE":
        return jsonify({
            "success": False,
            "message": f"Payment not complete: {verify_data.get('status')}",
        }), 400

    try:
        expires_at = save_payment_and_activate(
            user_id      = user_id,
            tx_uuid      = verify_data.get("transaction_uuid", transaction_uuid),
            ref_id       = verify_data.get("ref_id"),
            product_code = verify_data.get("product_code", product_code),
            plan_name    = plan_name,
            amount       = float(str(total_amount).replace(",", "")),
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"DB save error: {str(e)}"}), 500

    return jsonify({
        "success":    True,
        "message":    "Payment verified and premium activated!",
        "plan":       plan_name,
        "expires_at": expires_at.isoformat(),
        "transaction": {
            "transaction_uuid": verify_data.get("transaction_uuid"),
            "total_amount":     verify_data.get("total_amount"),
            "status":           verify_data.get("status"),
            "ref_id":           verify_data.get("ref_id"),
        },
    })


@payment_bp.route("/history", methods=["GET"])
@jwt_required()
def payment_history():
    user_id = get_current_user_id()
    conn    = get_db()
    cur     = conn.cursor()

    cur.execute(
        """
        SELECT id, transaction_uuid, ref_id, plan_name, amount, status, created_at
        FROM   payments
        WHERE  user_id = %s
        ORDER  BY created_at DESC;
        """,
        (user_id,),
    )
    rows = []
    for r in cur.fetchall():
        r = dict(r)
        r["created_at"] = r["created_at"].isoformat() if r.get("created_at") else None
        rows.append(r)

    cur.close()
    return jsonify({"payments": rows})


@payment_bp.route("/status", methods=["GET"])
@jwt_required()
def premium_status():
    user_id = get_current_user_id()
    status  = get_premium_status(user_id)
    return jsonify(status)