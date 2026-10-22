import os
import sqlite3
from datetime import datetime
from typing import Optional, List, Dict, Any

DATABASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DATABASE_DIR, "securetrace.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS processed_documents (
            id TEXT PRIMARY KEY,
            original_filename TEXT NOT NULL,
            stored_watermarked_filename TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            original_size_bytes INTEGER NOT NULL,
            watermarked_size_bytes INTEGER NOT NULL,
            original_sha256 TEXT NOT NULL,
            watermarked_sha256 TEXT NOT NULL,
            watermark_type TEXT NOT NULL,
            watermark_text TEXT NOT NULL,
            recipient_id TEXT,
            font_size INTEGER,
            opacity REAL,
            rotation INTEGER,
            position TEXT,
            color TEXT,
            is_invisible INTEGER DEFAULT 0,
            invisible_bits_length INTEGER DEFAULT 0,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            action TEXT NOT NULL,
            original_sha256 TEXT NOT NULL,
            watermarked_sha256 TEXT NOT NULL,
            watermark_type TEXT NOT NULL,
            recipient_id TEXT,
            status TEXT NOT NULL,
            details TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (document_id) REFERENCES processed_documents(id)
        )
    """)
    conn.commit()
    conn.close()

def record_document(doc_data: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO processed_documents (
            id, original_filename, stored_watermarked_filename, mime_type,
            original_size_bytes, watermarked_size_bytes, original_sha256,
            watermarked_sha256, watermark_type, watermark_text, recipient_id,
            font_size, opacity, rotation, position, color,
            is_invisible, invisible_bits_length, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_data["id"],
        doc_data["original_filename"],
        doc_data["stored_watermarked_filename"],
        doc_data["mime_type"],
        doc_data["original_size_bytes"],
        doc_data["watermarked_size_bytes"],
        doc_data["original_sha256"],
        doc_data["watermarked_sha256"],
        doc_data["watermark_type"],
        doc_data["watermark_text"],
        doc_data.get("recipient_id"),
        doc_data.get("font_size"),
        doc_data.get("opacity"),
        doc_data.get("rotation"),
        doc_data.get("position"),
        doc_data.get("color"),
        1 if doc_data.get("is_invisible") else 0,
        doc_data.get("invisible_bits_length", 0),
        doc_data["status"],
        doc_data["created_at"]
    ))
    
    # Also append entry into activity ledger
    cursor.execute("""
        INSERT INTO activity_ledger (
            document_id, filename, action, original_sha256,
            watermarked_sha256, watermark_type, recipient_id,
            status, details, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_data["id"],
        doc_data["original_filename"],
        "DOCUMENT_WATERMARKED",
        doc_data["original_sha256"],
        doc_data["watermarked_sha256"],
        doc_data["watermark_type"],
        doc_data.get("recipient_id") or "UNSPECIFIED",
        doc_data["status"],
        f"Watermarked with text: '{doc_data['watermark_text']}' | Position: {doc_data.get('position', 'N/A')}",
        doc_data["created_at"]
    ))
    
    conn.commit()
    conn.close()

def log_verification(filename: str, original_hash: str, watermark_type: str, status: str, details: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO activity_ledger (
            document_id, filename, action, original_sha256,
            watermarked_sha256, watermark_type, recipient_id,
            status, details, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "VERIFICATION_CHECK",
        filename,
        "WATERMARK_VERIFIED",
        original_hash,
        original_hash,
        watermark_type,
        "AUDIT_AGENT",
        status,
        details,
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()

def get_all_documents() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM processed_documents ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_document_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM processed_documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_ledger_records() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM activity_ledger ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
