#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
EMAIL PRIORITY WORKER (Python 3.14 SAFE)

- MongoDB = source of truth
- Redis (RQ) = async queue
- Producer-only process
- Locking + retry + dead-letter
"""

from __future__ import annotations  # ✅ Python 3.14 safe typing

import sys
import io
import os
import time
import traceback
import logging
from datetime import datetime
from typing import Optional

import pymongo
import redis
from rq import Queue
from textblob import TextBlob

# -------------------------------------------------
# 0. WINDOWS UTF-8 FIX (SAFE)
# -------------------------------------------------
if sys.platform == "win32":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")
        os.environ["PYTHONIOENCODING"] = "utf-8"
    except Exception:
        pass

# -------------------------------------------------
# 1. LOGGING (Python 3.14 compatible)
# -------------------------------------------------
os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler("logs/email_worker.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)

logger = logging.getLogger("email-worker")
logger.info("🚀 Email Priority Worker starting")

# -------------------------------------------------
# 2. DATABASE CONNECTIONS
# -------------------------------------------------
mongo = pymongo.MongoClient("mongodb://localhost:27017/peppermint")
db = mongo["peppermint"]

emails_col = db["emailmessages"]
tickets_col = db["tickets"]

logger.info("✅ Connected to MongoDB")

# -------------------------------------------------
# 3. REDIS QUEUE (PRODUCER SIDE)
# -------------------------------------------------
redis_conn = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    decode_responses=True,
)

email_queue = Queue(
    name="email_priority",
    connection=redis_conn,
    default_timeout=300,
)

logger.info("✅ Connected to Redis (RQ)")

# -------------------------------------------------
# 4. PRIORITY DETECTION (UNCHANGED LOGIC)
# -------------------------------------------------
def detect_priority(subject: str, body: str = "") -> str:
    text = f"{subject} {body}".lower().strip()

    if not text:
        return "low"

    critical = ("urgent", "critical", "system down", "server down", "outage")
    high = ("cannot access", "security", "data loss", "major")
    medium = ("error", "issue", "bug", "slow", "login")

    if any(k in text for k in critical):
        return "critical"
    if any(k in text for k in high):
        return "high"
    if any(k in text for k in medium):
        return "medium"

    try:
        polarity = TextBlob(text).sentiment.polarity
        if polarity < -0.4:
            return "critical"
        if polarity < -0.2:
            return "high"
        if polarity < -0.05:
            return "medium"
        return "low"
    except Exception:
        return "low"

# -------------------------------------------------
# 5. CORE EMAIL PROCESSOR (EXECUTED BY RQ WORKERS)
# -------------------------------------------------
def process_email(email_id):
    """
    This function is executed by RQ CONSUMER workers
    """

    # 🔒 Atomic lock
    lock = emails_col.update_one(
        {
            "_id": email_id,
            "analysis_lock": {"$ne": True},
            "dead_lettered": {"$ne": True},
        },
        {"$set": {"analysis_lock": True}},
    )

    if lock.modified_count == 0:
        logger.info(f"🔁 Skipped (locked/dead): {email_id}")
        return

    try:
        email = emails_col.find_one({"_id": email_id})
        if not email or email.get("sentiment_analyzed"):
            return

        subject = email.get("subject", "")
        body = email.get("body", "")
        ticket_id = email.get("ticketId")

        new_priority = detect_priority(subject, body)

        emails_col.update_one(
            {"_id": email_id},
            {
                "$set": {
                    "priority": new_priority,
                    "priority_updated_at": datetime.utcnow(),
                    "sentiment_analyzed": True,
                }
            },
        )

        if ticket_id:
            tickets_col.update_one(
                {"_id": ticket_id},
                {
                    "$set": {
                        "priority": new_priority,
                        "priority_updated_at": datetime.utcnow(),
                        "sentiment_analyzed": True,
                    }
                },
            )

        logger.info(f"✅ Email {email_id} → {new_priority}")

    except Exception as exc:
        logger.error(f"❌ Failed email {email_id}: {exc}")
        logger.error(traceback.format_exc())

        emails_col.update_one(
            {"_id": email_id},
            {"$inc": {"retry_count": 1}},
        )

        email = emails_col.find_one({"_id": email_id})
        retries = email.get("retry_count", 0)
        max_retries = email.get("max_retries", 3)

        if retries >= max_retries:
            emails_col.update_one(
                {"_id": email_id},
                {
                    "$set": {
                        "dead_lettered": True,
                        "dead_lettered_at": datetime.utcnow(),
                    }
                },
            )
            logger.error(f"☠️ Dead-lettered email: {email_id}")

    finally:
        # 🔓 Always release lock
        emails_col.update_one(
            {"_id": email_id},
            {"$unset": {"analysis_lock": ""}},
        )

# -------------------------------------------------
# 6. PRODUCER: SCAN DB → ENQUEUE JOBS
# -------------------------------------------------
def enqueue_pending_emails() -> None:
    pending = list(
        emails_col.find(
            {
                "priority": "pending",
                "sentiment_analyzed": {"$ne": True},
                "analysis_lock": {"$ne": True},
                "dead_lettered": {"$ne": True},
                "retry_count": {"$lt": 3},
            },
            {"_id": 1},
            limit=20,
        )
    )

    if not pending:
        return

    for email in pending:
        email_queue.enqueue(
            process_email,
            email["_id"],
            retry=3,
            job_timeout=300,
        )

    logger.info(f"📤 Enqueued {len(pending)} emails")

# -------------------------------------------------
# 7. MAIN LOOP (PRODUCER MODE)
# -------------------------------------------------
def run_producer() -> None:
    logger.info("🟢 Producer running (DB → Redis)")
    while True:
        enqueue_pending_emails()
        time.sleep(5)

# -------------------------------------------------
# 8. ENTRY POINT
# -------------------------------------------------
if __name__ == "__main__":
    try:
        run_producer()
    except KeyboardInterrupt:
        logger.info("🛑 Producer stopped")
    finally:
        mongo.close()
