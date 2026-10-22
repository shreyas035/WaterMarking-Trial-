# SecureTrace AI — Document Watermarking Lab

**Final-Year Computer Engineering Project Prototype**  
Enterprise-grade document watermarking, verification, and cryptographic audit ledger.

---

## Architecture Overview

SecureTrace AI provides client-side document inspection and server-side cryptographic and content watermarking:
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React (dark navy cybersecurity dashboard theme).
- **Backend API**: Python FastAPI, PyMuPDF (PDF vector & content layer insertion), Pillow (image alpha compositing & LSB steganography).
- **Persistence**: SQLite (`backend/securetrace.db`) with SHA-256 pre- and post-processing cryptographic ledger tracking.
- **Zero Cloud/Docker Dependencies**: 100% open-source local execution on Windows.

---

## Watermarking Technologies & Algorithmic Analysis

| Mode | Target Documents | Algorithm & Technique | Extraction / Verification Capability | Limitations |
| :--- | :--- | :--- | :--- | :--- |
| **Visible Watermark** | PDF, PNG, JPG, JPEG | PyMuPDF content layer text insertion; Pillow RGBA alpha-composite overlay with customizable opacity, rotation, and alignment. | Detected via PDF text layer stream parsing. On images, pixel blending rasterizes text without OCR. | Optical OCR would be required for deterministic text reconstruction on flattened images. |
| **Subtle Watermark** | PDF, PNG, JPG, JPEG | Low-opacity (&le; 0.15) diagonal or margin watermark for unobtrusive ownership attribution. | Same as visible mode. | Designed for minimal human distraction while retaining forensic traceability. |
| **Invisible Watermark (LSB)** | PNG, JPEG (saved as lossless PNG) | Genuine Least Significant Bit (LSB) pixel steganography with magic signature tokens `SECURETRACE::...::END`. | Mathematically extractable bit-by-bit via server verification lab without original reference image. | Vulnerable to lossy re-compression (e.g. converting to JPEG), geometric scaling, or aggressive cropping. |
| **Invisible PDF Watermarking** | PDF | **Marked Pending / Future Research Capability** | Not claimed | Standard metadata tags or hidden object layers do not constitute genuine content-level steganography. Marked pending to preserve scientific integrity. |

---

## Security & Ledger Principles

- **Audit Ledger (Conventional SQLite DB)**: This ledger records file transactions in `backend/securetrace.db`. It is **not** a blockchain.
- **SHA-256 Hashes**: Python `hashlib` computes SHA-256 hashes of the file before watermarking and after watermarking. A changed hash proves that the file content was modified by the watermarking engine, but hash modification does not inherently imply malicious tampering.

---

## Project Structure

```
WATERMARK/
├── backend/
│   ├── main.py               # FastAPI application endpoints & lifecycle
│   ├── watermark_engine.py   # PyMuPDF, Pillow & LSB steganography algorithms
│   ├── database.py           # SQLite connection & schema for documents & ledger
│   ├── securetrace.db        # SQLite database (auto-created on first run)
│   └── storage/
│       ├── originals/        # Uploaded source documents
│       └── watermarked/      # Generated watermarked documents
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Overview.jsx              # System metrics & algorithm specifications
│   │   │   ├── UploadWatermark.jsx       # Drag-and-drop upload, params & live preview
│   │   │   ├── ProcessedDocuments.jsx    # Document catalog, search & download
│   │   │   ├── WatermarkVerification.jsx # LSB extraction & content verification lab
│   │   │   └── ActivityLedger.jsx        # SQLite audit ledger with hash logs
│   │   ├── services/
│   │   │   └── api.js                   # Centralized API service layer
│   │   ├── App.jsx                       # Root dashboard & navigation
│   │   ├── index.css                     # Tailwind CSS v4 styling & dark theme
│   │   └── main.jsx                      # React DOM entry point
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .env
├── requirements.txt          # Python dependencies
├── test_integration.py       # Automated integration test suite
└── README.md                 # Complete documentation
```

---

## Setup & Execution Guide (Windows)

### Prerequisites
- Python 3.10+ (Verified on Python 3.13)
- Node.js 18+ and npm

---

### Step 1: Backend Setup & Launch

Open **Terminal 1** (in `d:\Final Project\WATERMARK`):

```powershell
# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install required Python packages
pip install -r requirements.txt

# Start the FastAPI server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

FastAPI server runs at: `http://127.0.0.1:8000`  
Interactive Swagger docs: `http://127.0.0.1:8000/docs`

---

### Step 2: Frontend Setup & Launch

Open **Terminal 2** (in `d:\Final Project\WATERMARK\frontend`):

```powershell
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```

The web dashboard is accessible at: `http://localhost:5173/`

---

## API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check, engine versions, and algorithm declarations. |
| `POST` | `/api/watermark` | Accepts multipart form data with file & configuration; returns watermarked file and SHA-256 hashes. |
| `GET` | `/api/documents` | Lists all stored watermarked documents. |
| `GET` | `/api/documents/{id}/download` | Downloads the actual watermarked document with proper MIME headers. |
| `POST` | `/api/verify` | Uploads a document to detect or extract watermark via LSB or stream analysis. |
| `GET` | `/api/ledger` | Retrieves SQLite activity ledger records. |

---

## Running the Automated Test Suite

With the backend running, execute:

```powershell
.\venv\Scripts\python test_integration.py
```

This automated script validates:
1. Health check availability.
2. Real PDF text and vector watermark embedding via PyMuPDF.
3. Downloading and reading back watermarked PDF streams.
4. Invisible LSB steganography image generation.
5. Bit-level LSB extraction and string matching in the verification lab.
6. SQLite ledger persistence and SHA-256 pre/post consistency.
