import { loginRequest } from "../api.js";
import { saveSession, redirectIfLoggedIn } from "../auth.js";

redirectIfLoggedIn();

const form = document.querySelector(".login-form");
const errorBox = document.createElement("p");
errorBox.className = "form-error";
form.prepend(errorBox);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  errorBox.textContent = "";

  const email = form.querySelector('input[type="email"]').value.trim();
  const password = form.querySelector('input[type="password"]').value;

  try {
    const data = await loginRequest(email, password);
    saveSession(data.token, data.user);
    window.location.href = "./home.html";
  } catch (error) {
    errorBox.textContent = error.message;
  }
});
