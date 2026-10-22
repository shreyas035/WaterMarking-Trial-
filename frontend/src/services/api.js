/**
 * SecureTrace AI API Service
 * Centralizes all HTTP communication with the FastAPI backend.
 * Uses environment variable VITE_API_URL or defaults to relative '/api'.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiService = {
  /**
   * Health check
   */
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return await res.json();
  },

  /**
   * Submit document and watermark settings for real server-side watermarking
   */
  async applyWatermark(formData) {
    const res = await fetch(`${API_BASE}/watermark`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Watermark processing failed.');
    }
    return data;
  },

  /**
   * Get list of all watermarked documents
   */
  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents.');
    return await res.json();
  },

  /**
   * Verify watermark on an uploaded document
   */
  async verifyWatermark(formData) {
    const res = await fetch(`${API_BASE}/verify`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Verification request failed.');
    }
    return data;
  },

  /**
   * Get activity ledger records
   */
  async getLedger() {
    const res = await fetch(`${API_BASE}/ledger`);
    if (!res.ok) throw new Error('Failed to fetch ledger.');
    return await res.json();
  },

  /**
   * Generate download URL for a document ID
   */
  getDownloadUrl(docId) {
    return `${API_BASE}/documents/${docId}/download`;
  }
};
