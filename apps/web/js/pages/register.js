import { registerUser } from "../services/api.js";
import { saveSession } from "../services/auth.js";

const form = document.getElementById("register-form");
const errorEl = document.getElementById("register-error");
const emailField = document.getElementById("register-email");
const passwordField = document.getElementById("register-password");
const confirmField = document.getElementById("register-password-confirm");

function showError(message) {
  if (!errorEl) return;
  errorEl.hidden = !message;
  errorEl.textContent = message;
}

function fillEmailFromUrl() {
  const email = new URLSearchParams(window.location.search).get("email");
  if (email && emailField) emailField.value = email;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  if (passwordField.value !== confirmField.value) {
    showError("As senhas não coincidem.");
    return;
  }

  try {
    const data = await registerUser({
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value,
    });
    saveSession(data);
    window.location.href = "home.html";
  } catch (error) {
    showError(error.message);
  }
});

fillEmailFromUrl();
