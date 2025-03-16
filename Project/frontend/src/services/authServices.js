// src/services/authServices.js
const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT;

export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    return data;
  } catch (error) {
    throw error;
  }
}

export async function registerUser(name, email, password, confirm_password) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirm_password })
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    return data;
  } catch (error) {
    throw error;
  }
}
