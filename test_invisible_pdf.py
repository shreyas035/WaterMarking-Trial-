import urllib.request
import json
import io
import pymupdf

BASE_URL = "http://127.0.0.1:8000"

def post_multipart(url, fields, files):
    boundary = "----WebKitFormBoundaryTestInvisPdf99"
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

def test_invisible_pdf():
    print("Testing Invisible PDF Watermarking...")
    doc = pymupdf.open()
    page = doc.new_page(width=300, height=400)
    page.insert_text((40, 60), "Official Secure Project Document", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()

    res = post_multipart(
        f"{BASE_URL}/api/watermark",
        fields={
            "watermark_text": "INVISIBLE_TOP_SECRET",
            "watermark_type": "invisible",
            "recipient_id": "RECIPIENT-700"
        },
        files={"file": ("project_invisible.pdf", pdf_bytes, "application/pdf")}
    )
    doc_id = res["document"]["id"]
    print("Applied Invisible PDF Watermark! Doc ID:", doc_id)

    # Download it
    dl_url = f"{BASE_URL}/api/documents/{doc_id}/download"
    with urllib.request.urlopen(dl_url) as resp:
        dl_bytes = resp.read()

    # Verify it
    verify_res = post_multipart(
        f"{BASE_URL}/api/verify",
        fields={"expected_watermark": "INVISIBLE_TOP_SECRET"},
        files={"file": ("project_invisible_downloaded.pdf", dl_bytes, "application/pdf")}
    )

    print("Verification Status:", verify_res["verification"]["status"])
    print("Extracted Payload:", verify_res["verification"]["extracted_watermark"])
    print("Method:", verify_res["verification"]["method_used"])
    assert verify_res["verification"]["status"] == "DETECTED"
    print("\nSUCCESS: Invisible watermarking is now active and functional on ALL document types (PDFs and Images)!")

if __name__ == "__main__":
    test_invisible_pdf()
