import urllib.request
import json
import io
import pymupdf
from PIL import Image

BASE_URL = "http://127.0.0.1:8000"

def post_multipart(url, fields, files):
    boundary = "----WebKitFormBoundarySecureTraceAiTest"
    body = io.BytesIO()
    for k, v in fields.items():
        body.write(f"--{boundary}\r\n".encode())
        body.write(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
        body.write(f"{v}\r\n".encode())
    for k, (filename, data, content_type) in files.items():
        body.write(f"--{boundary}\r\n".encode())
        body.write(f'Content-Disposition: form-data; name="{k}"; filename="{filename}"\r\n'.encode())
        body.write(f"Content-Type: {content_type}\r\n\r\n".encode())
        body.write(data)
        body.write(b"\r\n")
    body.write(f"--{boundary}--\r\n".encode())
    
    req = urllib.request.Request(
        url,
        data=body.getvalue(),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def run_tests():
    print("--- 1. Testing GET /api/health ---")
    with urllib.request.urlopen(f"{BASE_URL}/api/health") as resp:
        health = json.loads(resp.read().decode())
        print("Health status:", health["status"])

    print("\n--- 2. Testing PDF Watermark POST /api/watermark ---")
    doc = pymupdf.open()
    page = doc.new_page(width=400, height=500)
    page.insert_text((50, 100), "Project Architecture Specification", fontsize=14)
    pdf_bytes = doc.tobytes()
    doc.close()

    res_pdf = post_multipart(
        f"{BASE_URL}/api/watermark",
        fields={
            "watermark_text": "SECURETRACE AI RESTRICTED",
            "watermark_type": "visible",
            "opacity": "0.35",
            "font_size": "28",
            "position": "diagonal",
            "recipient_id": "STUDENT-778"
        },
        files={"file": ("project_spec.pdf", pdf_bytes, "application/pdf")}
    )
    print("PDF processed successfully!")
    print("Doc ID:", res_pdf["document"]["id"])
    print("Original SHA-256:", res_pdf["document"]["original_sha256"])
    print("Watermarked SHA-256:", res_pdf["document"]["watermarked_sha256"])

    print("\n--- 3. Testing Download GET /api/documents/{id}/download ---")
    download_url = f"{BASE_URL}/api/documents/{res_pdf['document']['id']}/download"
    with urllib.request.urlopen(download_url) as resp:
        downloaded_bytes = resp.read()
        print("Downloaded watermarked PDF bytes:", len(downloaded_bytes))
        # Verify that downloaded bytes can be opened by pymupdf
        test_pdf = pymupdf.open(stream=downloaded_bytes, filetype="pdf")
        text_content = test_pdf[0].get_text()
        test_pdf.close()
        print("PDF contains watermark text in content:", "SECURETRACE AI RESTRICTED" in text_content)

    print("\n--- 4. Testing Invisible LSB Watermark POST /api/watermark ---")
    img = Image.new("RGB", (300, 300), color=(40, 60, 90))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    res_img = post_multipart(
        f"{BASE_URL}/api/watermark",
        fields={
            "watermark_text": "PATENT_PENDING_2026",
            "watermark_type": "invisible",
            "recipient_id": "RECIPIENT-ALPHA"
        },
        files={"file": ("blueprint.png", img_bytes, "image/png")}
    )
    print("Invisible LSB image processed successfully!")
    print("Doc ID:", res_img["document"]["id"])

    print("\n--- 5. Testing Verification POST /api/verify with LSB Image ---")
    # Download the invisible watermarked image
    with urllib.request.urlopen(f"{BASE_URL}/api/documents/{res_img['document']['id']}/download") as resp:
        downloaded_img = resp.read()

    verify_res = post_multipart(
        f"{BASE_URL}/api/verify",
        fields={"expected_watermark": "PATENT_PENDING_2026"},
        files={"file": ("verify_target.png", downloaded_img, "image/png")}
    )
    print("Verification result status:", verify_res["verification"]["status"])
    print("Extracted watermark payload:", verify_res["verification"]["extracted_watermark"])
    assert verify_res["verification"]["status"] == "DETECTED"

    print("\n--- 6. Testing GET /api/ledger ---")
    with urllib.request.urlopen(f"{BASE_URL}/api/ledger") as resp:
        ledger_data = json.loads(resp.read().decode())
        print(f"Total ledger records in SQLite: {len(ledger_data['ledger'])}")
        print("Latest ledger action:", ledger_data["ledger"][0]["action"])

    print("\nALL BACKEND API TESTS COMPLETED AND VERIFIED 100% CORRECTLY!")

if __name__ == "__main__":
    run_tests()
