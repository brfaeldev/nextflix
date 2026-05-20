import { loginUser } from "../services/api.js";
import { saveSession } from "../services/auth.js";

const form = document.getElementById("login-form");
const errorEl = document.getElementById("login-error");

function showError(message) {
  if (!errorEl) return;
  errorEl.hidden = !message;
  errorEl.textContent = message;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const email = form.email.value.trim();
  const password = form.password.value;

  try {
    const data = await loginUser({ email, password });
    saveSession(data);
    window.location.href = "home.html";
  } catch (error) {
    showError(error.message);
  }
});
