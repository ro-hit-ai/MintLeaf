#!/usr/bin/env python3
import sys
import pymongo
import logging

# Simple logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Connect to MongoDB
mongo_client = pymongo.MongoClient("mongodb://localhost:27017/peppermint")
db = mongo_client["peppermint"]
emails_col = db["emailmessages"]
tickets_col = db["tickets"]

def debug_emails():
    """Debug script to check email and ticket priorities"""
    logger.info("=== EMAIL PRIORITY DEBUG ===")
    
    # 1. Total emails
    total_emails = emails_col.count_documents({})
    logger.info(f"Total emails in database: {total_emails}")
    
    # 2. All unique priority values
    all_priorities = emails_col.distinct("priority")
    logger.info(f"All priority values found: {all_priorities}")
    
    # 3. Emails with 'pending' priority
    pending_emails = emails_col.count_documents({"priority": "pending"})
    logger.info(f"Emails with priority='pending': {pending_emails}")
    
    # 4. Emails not sentiment analyzed
    unanalyzed_emails = emails_col.count_documents({"sentiment_analyzed": {"$ne": True}})
    logger.info(f"Emails with sentiment_analyzed != true: {unanalyzed_emails}")
    
    # 5. Exact service query
    exact_query_count = emails_col.count_documents({
        "priority": "pending", 
        "sentiment_analyzed": {"$ne": True},
        "folder": {"$in": ["inbox", "processed"]}
    })
    logger.info(f"Exact service query count: {exact_query_count}")
    
    # 6. Sample emails (all recent ones)
    logger.info("\n=== SAMPLE RECENT EMAILS ===")
    sample_emails = list(emails_col.find(
        {}, 
        {"subject": 1, "priority": 1, "sentiment_analyzed": 1, "folder": 1, "from": 1, "createdAt": 1, "_id": 0}
    ).sort("createdAt", -1).limit(5))
    
    for i, email in enumerate(sample_emails, 1):
        logger.info(f"Email {i} (Subject: {email.get('subject', 'No Subject')[:50]}...)")
        logger.info(f"  Priority: '{email.get('priority', 'MISSING')}'")
        logger.info(f"  Analyzed: {email.get('sentiment_analyzed', 'MISSING')}")
        logger.info(f"  Folder: '{email.get('folder', 'MISSING')}'")
        logger.info(f"  From: {email.get('from', 'MISSING')}")
        logger.info(f"  Created: {email.get('createdAt', 'MISSING')}")
        logger.info("---")
    
    # 7. Sample tickets
    logger.info("\n=== SAMPLE RECENT TICKETS ===")
    sample_tickets = list(tickets_col.find(
        {}, 
        {"title": 1, "priority": 1, "sentiment_analyzed": 1, "email": 1, "createdAt": 1, "_id": 0}
    ).sort("createdAt", -1).limit(5))
    
    for i, ticket in enumerate(sample_tickets, 1):
        logger.info(f"Ticket {i} (Title: {ticket.get('title', 'No Title')[:50]}...)")
        logger.info(f"  Priority: '{ticket.get('priority', 'MISSING')}'")
        logger.info(f"  Analyzed: {ticket.get('sentiment_analyzed', 'MISSING')}")
        logger.info(f"  Email: {ticket.get('email', 'MISSING')}")
        logger.info(f"  Created: {ticket.get('createdAt', 'MISSING')}")
        logger.info("---")
    
    # 8. Find email matching the ticket you provided
    logger.info("\n=== MATCHING EMAIL FOR TKT-000013 ===")
    matching_email = list(emails_col.find({
        "from": "rohithkomatireddy051@gmail.com",
        "subject": {"$regex": "CRITICAL: Database completely down!", "$options": "i"}
    }).sort("createdAt", -1).limit(1))
    
    if matching_email:
        email = matching_email[0]
        logger.info(f"Found matching email:")
        logger.info(f"  ID: {email['_id']}")
        logger.info(f"  Subject: {email.get('subject', 'N/A')}")
        logger.info(f"  Priority: {email.get('priority', 'MISSING')}")
        logger.info(f"  Analyzed: {email.get('sentiment_analyzed', 'MISSING')}")
        logger.info(f"  Folder: {email.get('folder', 'MISSING')}")
        logger.info(f"  Created At: {email.get('createdAt', 'MISSING')}")
    else:
        logger.info("No matching email found for the ticket")
    
    logger.info("=== DEBUG COMPLETE ===")

if __name__ == "__main__":
    debug_emails()
    mongo_client.close()