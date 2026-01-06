#!/usr/bin/env python3
import pymongo
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_client = pymongo.MongoClient("mongodb://localhost:27017/peppermint")
db = mongo_client["peppermint"]
emails_col = db["emailmessages"]

def fix_emails():
    """Fix existing emails to have pending priority"""
    logger.info("Fixing existing emails...")
    
    # Set priority to 'pending' and sentiment_analyzed to false for all emails without these fields
    result1 = emails_col.update_many(
        {"$or": [
            {"priority": {"$exists": False}},
            {"sentiment_analyzed": {"$exists": False}}
        ]},
        {"$set": {
            "priority": "pending",
            "sentiment_analyzed": False
        }}
    )
    logger.info(f"Fixed {result1.modified_count} emails")
    
    # Verify
    pending_count = emails_col.count_documents({
        "priority": "pending",
        "sentiment_analyzed": False
    })
    logger.info(f"Now have {pending_count} pending emails ready for analysis")

if __name__ == "__main__":
    fix_emails()
    mongo_client.close()