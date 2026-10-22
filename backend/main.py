import os
import uuid
import base64
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse

from backend.database import (
    init_db,
    record_document,
    get_all_documents,
    get_document_by_id,
    get_ledger_records,
    log_verification
)
from backend.watermark_engine import (
    watermark_pdf,
    watermark_pdf_invisible,
    watermark_image_visible,
    watermark_image_invisible_lsb,
    calculate_sha256,
    verify_document_content
)

# Initialize storage directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
ORIGINALS_DIR = os.path.join(STORAGE_DIR, "originals")
WATERMARKED_DIR = os.path.join(STORAGE_DIR, "watermarked")

os.makedirs(ORIGINALS_DIR, exist_ok=True)
os.makedirs(WATERMARKED_DIR, exist_ok=True)

# Initialize Database Schema
init_db()

app = FastAPI(
    title="SecureTrace AI Document Watermarking Engine",
    description="Enterprise grade document watermarking, verification, and cryptographic audit ledger.",
    version="1.0.0"
)

# Enable CORS for local Vite development & integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supported MIME types and max size (25MB)
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 25 * 1024 * 1024

def sanitize_filename(filename: str) -> str:
    """Strip path traversal characters and retain safe basename."""
    base = os.path.basename(filename)
    return "".join(c for c in base if c.isalnum() or c in (".", "_", "-", " ")).strip()

@app.get("/")
def root():
    """Root endpoint welcoming users and directing to API docs and frontend."""
    return {
        "service": "SecureTrace AI Document Watermarking Engine",
        "status": "online",
        "documentation": "/docs",
        "health_check": "/api/health",
        "frontend_url": "http://localhost:5173"
    }

@app.get("/api/health")

def health_check():
    """Health check endpoint providing engine status and features."""
    return {
        "status": "healthy",
        "service": "SecureTrace AI Document Watermarking Lab",
        "version": "1.0.0",
        "algorithms": {
            "pdf": "PyMuPDF Content Layer Vector & Text Overlay",
            "image_visible": "Pillow RGBA Antialiased Alpha Blending",
            "image_invisible": "LSB (Least Significant Bit) Pixel Steganography",
            "pdf_invisible": "Marked pending/future capability (Content-level only)"
        },
        "system_time": datetime.now().isoformat()
    }

@app.post("/api/watermark")
async def apply_watermark(
    file: UploadFile = File(...),
    watermark_text: str = Form("SECURETRACE AI"),
    watermark_type: str = Form("visible"),  # visible, subtle, invisible
    opacity: float = Form(0.3),
    font_size: int = Form(36),
    rotation: int = Form(45),
    position: str = Form("diagonal"),  # diagonal, center, bottom-right
    color: str = Form("#ffffff"),
    recipient_id: Optional[str] = Form(None)
):
    """
    Accepts document (PDF or PNG/JPEG), validates size/type, embeds genuine server-side watermark,
    records SHA-256 hashes, logs to SQLite ledger, and returns document metadata + preview payload.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file missing filename.")
        
    safe_name = sanitize_filename(file.filename)
    ext = os.path.splitext(safe_name)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: PDF, PNG, JPG, JPEG."
        )

    # Read file content safely
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds maximum 25MB limit.")

    # Compute original SHA-256
    orig_sha256 = calculate_sha256(contents)
    doc_id = str(uuid.uuid4())
    
    # Compose final watermark text with optional recipient
    final_wm_text = watermark_text.strip() if watermark_text else "SECURETRACE AI"
    if recipient_id and recipient_id.strip():
        final_wm_text = f"{final_wm_text} | SHARED WITH {recipient_id.strip()}"

    # Handle invisible watermarking validation
    is_invisible = (watermark_type == "invisible")

    # Set subtle opacity defaults if subtle selected
    effective_opacity = opacity
    if watermark_type == "subtle":
        effective_opacity = min(opacity, 0.15) if opacity > 0.15 else opacity

    # Process file based on extension
    try:
        if ext == ".pdf":
            if is_invisible:
                out_bytes = watermark_pdf_invisible(
                    input_bytes=contents,
                    secret_text=final_wm_text
                )
            else:
                out_bytes = watermark_pdf(
                    input_bytes=contents,
                    text=final_wm_text,
                    opacity=effective_opacity,
                    font_size=font_size,
                    rotation=rotation,
                    position=position,
                    color_hex=color
                )
            out_mime = "application/pdf"
            out_filename = f"{os.path.splitext(safe_name)[0]}_watermarked.pdf"
        elif ext in [".png", ".jpg", ".jpeg"]:
            if is_invisible:
                out_bytes, out_mime = watermark_image_invisible_lsb(contents, final_wm_text)
                out_filename = f"{os.path.splitext(safe_name)[0]}_watermarked.png"
            else:
                out_bytes, out_mime = watermark_image_visible(
                    input_bytes=contents,
                    text=final_wm_text,
                    opacity=effective_opacity,
                    font_size=font_size,
                    rotation=rotation,
                    position=position,
                    color_hex=color
                )
                ext_save = ".jpg" if out_mime == "image/jpeg" else ".png"
                out_filename = f"{os.path.splitext(safe_name)[0]}_watermarked{ext_save}"
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Watermarking processing failed: {str(e)}")

    watermarked_sha256 = calculate_sha256(out_bytes)
    
    # Store processed watermarked file on disk
    stored_wm_name = f"{doc_id}_{out_filename}"
    stored_path = os.path.join(WATERMARKED_DIR, stored_wm_name)
    with open(stored_path, "wb") as f:
        f.write(out_bytes)

    # Generate preview data URI for frontend if image or PDF
    preview_url = f"/api/documents/{doc_id}/download"
    preview_data_uri = None
    if out_mime.startswith("image/"):
        b64 = base64.b64encode(out_bytes).decode('ascii')
        preview_data_uri = f"data:{out_mime};base64,{b64}"

    # Record in SQLite Database and Ledger
    created_at = datetime.now().isoformat()
    doc_record = {
        "id": doc_id,
        "original_filename": safe_name,
        "stored_watermarked_filename": stored_wm_name,
        "mime_type": out_mime,
        "original_size_bytes": len(contents),
        "watermarked_size_bytes": len(out_bytes),
        "original_sha256": orig_sha256,
        "watermarked_sha256": watermarked_sha256,
        "watermark_type": watermark_type,
        "watermark_text": final_wm_text,
        "recipient_id": recipient_id.strip() if recipient_id else None,
        "font_size": font_size,
        "opacity": effective_opacity,
        "rotation": rotation,
        "position": position,
        "color": color,
        "is_invisible": is_invisible,
        "invisible_bits_length": len(final_wm_text) * 8 if is_invisible else 0,
        "status": "PROCESSED",
        "created_at": created_at
    }
    record_document(doc_record)

    return {
        "success": True,
        "message": "Watermark successfully embedded.",
        "document": {
            **doc_record,
            "preview_data_uri": preview_data_uri,
            "download_url": preview_url
        }
    }

@app.get("/api/documents")
def list_documents():
    """Retrieve history of all processed documents."""
    docs = get_all_documents()
    for d in docs:
        d["download_url"] = f"/api/documents/{d['id']}/download"
    return {"documents": docs}

@app.get("/api/documents/{doc_id}/download")
def download_watermarked_document(doc_id: str):
    """Download the actual watermarked document with safe headers."""
    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    file_path = os.path.join(WATERMARKED_DIR, doc["stored_watermarked_filename"])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Watermarked file not found on server storage.")

    download_name = doc["original_filename"].rsplit('.', 1)[0] + "_watermarked." + doc["mime_type"].split('/')[-1]
    if "pdf" in doc["mime_type"]:
        download_name = doc["original_filename"].rsplit('.', 1)[0] + "_watermarked.pdf"

    return FileResponse(
        path=file_path,
        media_type=doc["mime_type"],
        filename=download_name,
        headers={"Content-Disposition": f'attachment; filename="{download_name}"'}
    )

@app.post("/api/verify")
async def verify_watermark(
    file: UploadFile = File(...),
    expected_watermark: Optional[str] = Form(None)
):
    """
    Accepts an uploaded document to verify watermark presence:
    - Calculates genuine SHA-256
    - Runs LSB extraction on images or PyMuPDF content layer scan on PDFs
    - Logs verification attempt into SQLite activity ledger
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    safe_name = sanitize_filename(file.filename)
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    mime_type = file.content_type or "application/octet-stream"
    if safe_name.lower().endswith(".pdf"):
        mime_type = "application/pdf"
    elif safe_name.lower().endswith(".png"):
        mime_type = "image/png"
    elif safe_name.lower().endswith((".jpg", ".jpeg")):
        mime_type = "image/jpeg"

    verification_result = verify_document_content(
        file_bytes=contents,
        mime_type=mime_type,
        expected_watermark=expected_watermark
    )

    # Log to SQLite ledger
    log_verification(
        filename=safe_name,
        original_hash=verification_result["file_sha256"],
        watermark_type="CONTENT_INSPECTION",
        status=verification_result["status"],
        details=verification_result["details"]
    )

    return {
        "success": True,
        "filename": safe_name,
        "verification": verification_result
    }

@app.get("/api/ledger")
def get_ledger():
    """Retrieve activity records from the SQLite audit ledger."""
    records = get_ledger_records()
    return {
        "ledger": records,
        "note": "Conventional database-backed audit ledger. SHA-256 changes indicate modified document content, not inherent malicious tampering."
    }
