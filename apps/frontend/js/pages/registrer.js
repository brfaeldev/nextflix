import { registerRequest } from "../api.js";
import { saveSession, redirectIfLoggedIn } from "../auth.js";

redirectIfLoggedIn();

const form = document.querySelector(".login-form");
const errorBox = document.createElement("p");
errorBox.className = "form-error";
form.prepend(errorBox);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  errorBox.textContent = "";

  const inputs = form.querySelectorAll("input");
  const name = inputs[0].value.trim();
  const email = inputs[1].value.trim();
  const password = inputs[2].value;
  const confirmPassword = inputs[3].value;

  if (password !== confirmPassword) {
    errorBox.textContent = "As senhas não coincidem";
    return;
  }

  try {
    const data = await registerRequest(name, email, password);
    saveSession(data.token, data.user);
    window.location.href = "./home.html";
  } catch (error) {
    errorBox.textContent = error.message;
  }
});
