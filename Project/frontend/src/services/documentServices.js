const BASE_URL = import.meta.env.VITE_API_ENDPOINT;

/**
 * Upload multiple documents.
 * @param {FormData} formData - The FormData object containing files (and optionally a batch_id).
 * @returns {Promise<Object>} API response including batch_id and document details.
 */
export async function uploadDocuments(formData) {
  try {
    // Check if formData has at least one file under 'file'
    if (!formData || !formData.has('file')) {
      throw new Error("No file provided");
    }

    const response = await fetch(`${BASE_URL}/documents/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    // Attach preview and download URLs to each document
    return {
      ...data,
      documents: data.documents.map(doc => ({
        ...doc,
        previewUrl: `${BASE_URL}/documents/preview/${doc.id}`,
        downloadUrl: `${BASE_URL}/documents/download/${doc.id}`
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
 * Get all document batches.
 * @returns {Promise<Array>} An array of detailed batch objects.
 * Each batch object includes:
 * - id: Batch ID.
 * - name: A generated name (e.g. "Batch 67e514ee").
 * - documentCount: Total number of documents in the batch.
 * - createdOn: Earliest creation date among documents in the batch.
 * - lastModified: Latest modification date among documents.
 * - totalFileSize: Sum of all document file sizes (formatted as "x.xx MB").
 * - fileTypes: An array of unique file types included in the batch.
 * - documents: The list of documents with full details.
 */
export async function getAllBatches() {
  try {
    const response = await fetch(`${BASE_URL}/documents/batches`, {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to retrieve batches");
    }
    // Expecting data.batches to contain the detailed batch objects from the backend.
    return data.batches;
  } catch (error) {
    console.error("Get All Batches Error:", error.message);
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
 * Delete a batch by its batch ID.
 * This deletes all documents associated with the given batch.
 * @param {string} batchId - The batch ID.
 * @returns {Promise<Object>} API response with deletion details.
 */
export async function deleteBatch(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/documents/batches/${batchId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete batch");
    }
    return data;
  } catch (error) {
    console.error("Delete Batch Error:", error.message);
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
