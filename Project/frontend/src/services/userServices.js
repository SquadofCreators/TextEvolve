// src/services/userServices.js
const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT;

export async function updateUser(userId, updatedData) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    return data;
  } catch (error) {
    throw error;
  }
}
