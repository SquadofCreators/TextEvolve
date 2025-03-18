const BASE_URL = import.meta.env.VITE_API_ENDPOINT;

/**
 * Upload multiple documents.
 * @param {FileList|Array<File>} files - Files to upload.
 * @returns {Promise<Object>} API response including batch_id and document details.
 */
export async function uploadDocuments(files) {
  try {
    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    const formData = new FormData();
    Array.from(files).forEach(file => formData.append("file", file));

    const response = await fetch(`${BASE_URL}/documents/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return {
      ...data,
      documents: data.documents.map(doc => ({
        ...doc,
        previewUrl: `${BASE_URL}/documents/preview/${doc.id}`, // ✅ Attach preview URL
        downloadUrl: `${BASE_URL}/documents/download/${doc.id}` // ✅ Attach download URL
      }))
    };
  } catch (error) {
    console.error("Upload error:", error.message);
    throw error;
  }
}

/**
 * Get a single document by its ID.
 * @param {string} docId - The document ID.
 * @returns {Promise<Object>} The document data.
 */
export async function getDocument(docId) {
  try {
    const response = await fetch(`${BASE_URL}/documents/${docId}`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to retrieve document");
    }

    // ✅ Attach preview and download URLs
    return {
      ...data,
      previewUrl: `${BASE_URL}/documents/preview/${data.id}`,
      downloadUrl: `${BASE_URL}/documents/download/${data.id}`
    };
  } catch (error) {
    console.error("Get Document Error:", error.message);
    throw error;
  }
}

/**
 * Get all documents by a batch ID.
 * @param {string} batchId - The batch ID.
 * @returns {Promise<Object>} API response containing documents in the batch.
 */
export async function getDocumentsByBatch(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/documents/batch/${batchId}`, {
      method: "GET",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to retrieve batch documents");
    }

    // ✅ Attach preview and download URLs to each document
    return {
      ...data,
      documents: data.documents.map(doc => ({
        ...doc,
        previewUrl: `${BASE_URL}/documents/preview/${doc.id}`,
        downloadUrl: `${BASE_URL}/documents/download/${doc.id}`
      }))
    };
  } catch (error) {
    console.error("Get Batch Documents Error:", error.message);
    throw error;
  }
}

/**
 * Get the download URL for a document.
 * @param {string} docId - The document ID.
 * @returns {string} The download URL.
 */
export function getDownloadURL(docId) {
  return `${BASE_URL}/documents/download/${docId}`;
}

/**
 * Get the preview URL for a document.
 * @param {string} docId - The document ID.
 * @returns {string} The preview URL.
 */
export function getPreviewURL(docId) {
  return `${BASE_URL}/documents/preview/${docId}`;
}
