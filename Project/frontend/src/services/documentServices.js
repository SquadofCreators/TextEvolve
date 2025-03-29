const BASE_URL = import.meta.env.VITE_API_ENDPOINT;

/**
 * Upload a new batch of documents.
 * @param {FormData} formData - Must contain files under key 'files'.
 * @returns {Promise<Object>} The uploaded batch data.
 */
export async function uploadDocuments(formData) {
  try {
    if (!formData || !formData.has("files")) {
      throw new Error("No file provided");
    }
    const response = await fetch(`${BASE_URL}/documents/upload_batch`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }
    return data;
  } catch (error) {
    console.error("Upload error:", error.message);
    throw error;
  }
}

/**
 * Retrieve a specific batch by its ID.
 * @param {string} batchId 
 * @returns {Promise<Object>} Batch data.
 */
export async function getBatch(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/documents/get_batch/${batchId}`, {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to retrieve batch");
    }
    return data;
  } catch (error) {
    console.error("Get Batch error:", error.message);
    throw error;
  }
}

/**
 * Retrieve all batches.
 * @returns {Promise<Array>} Array of batches.
 */
export async function getAllBatches() {
  try {
    const response = await fetch(`${BASE_URL}/documents/get_all_batches`, {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to retrieve batches");
    }
    return data;
  } catch (error) {
    console.error("Get All Batches error:", error.message);
    throw error;
  }
}

/**
 * Retrieve a preview (metadata) for all documents in a batch.
 * @param {string} batchId 
 * @returns {Promise<Array>} Array of document metadata.
 */
export async function previewBatchDocuments(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/documents/preview_batch_documents/${batchId}`, {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to preview batch documents");
    }
    return data;
  } catch (error) {
    console.error("Preview Batch Documents error:", error.message);
    throw error;
  }
}

/**
 * Download all documents in a batch as a zip file.
 * @param {string} batchId 
 * @returns {Promise<Blob>} Blob of the zip file.
 */
export async function downloadBatchDocuments(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/documents/download_batch_documents/${batchId}`, {
      method: "GET",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to download batch documents");
    }
    return await response.blob();
  } catch (error) {
    console.error("Download Batch Documents error:", error.message);
    throw error;
  }
}

/**
 * Delete a single batch by its ID.
 * @param {string} batchId 
 * @returns {Promise<Object>} Deletion response.
 */
export async function deleteBatch(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/documents/delete_batch/${batchId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete batch");
    }
    return data;
  } catch (error) {
    console.error("Delete Batch error:", error.message);
    throw error;
  }
}

/**
 * Delete all batches.
 * @returns {Promise<Object>} Deletion response.
 */
export async function deleteAllBatches() {
  try {
    const response = await fetch(`${BASE_URL}/documents/delete_all_batches`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete all batches");
    }
    return data;
  } catch (error) {
    console.error("Delete All Batches error:", error.message);
    throw error;
  }
}

/**
 * Retrieve a single document from a batch.
 * @param {string} batchId 
 * @param {string} docId 
 * @returns {Promise<Object>} Document data.
 */
export async function getDocument(batchId, docId) {
  try {
    const response = await fetch(`${BASE_URL}/documents/get_document/${batchId}/${docId}`, {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to get document");
    }
    return data;
  } catch (error) {
    console.error("Get Document error:", error.message);
    throw error;
  }
}

/**
 * Retrieve a preview URL of a single document.
 * The backend now returns only the preview_url (pointing to the uploaded document served inline).
 * @param {string} batchId 
 * @param {string} docId 
 * @returns {Promise<Object>} An object with the preview_url.
 */
export async function previewDocument(batchId, docId) {
  try {
    const response = await fetch(`${BASE_URL}/documents/preview_document/${batchId}/${docId}`, {
      method: "GET",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to preview document");
    }
    return data;
  } catch (error) {
    console.error("Preview Document error:", error.message);
    throw error;
  }
}

/**
 * Download a single document.
 * @param {string} batchId 
 * @param {string} docId 
 * @returns {Promise<Blob>} Blob of the document file.
 */
export async function downloadDocument(batchId, docId) {
  try {
    const response = await fetch(`${BASE_URL}/documents/download_document/${batchId}/${docId}`, {
      method: "GET",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to download document");
    }
    return await response.blob();
  } catch (error) {
    console.error("Download Document error:", error.message);
    throw error;
  }
}

/**
 * Delete a single document from a batch.
 * @param {string} batchId 
 * @param {string} docId 
 * @returns {Promise<Object>} Deletion response.
 */
export async function deleteDocument(batchId, docId) {
  try {
    const response = await fetch(`${BASE_URL}/documents/delete_document/${batchId}/${docId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete document");
    }
    return data;
  } catch (error) {
    console.error("Delete Document error:", error.message);
    throw error;
  }
}

/**
 * Construct the preview URL for a single document.
 * @param {string} batchId 
 * @param {string} docId 
 * @returns {string} Preview URL.
 */
export function getPreviewURL(batchId, docId) {
  return `${BASE_URL}/documents/preview_document/${batchId}/${docId}`;
}

/**
 * Construct the download URL for a single document.
 * @param {string} batchId 
 * @param {string} docId 
 * @returns {string} Download URL.
 */
export function getDownloadURL(batchId, docId) {
  return `${BASE_URL}/documents/download_document/${batchId}/${docId}`;
}
