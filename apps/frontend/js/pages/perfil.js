import { getMe, updateProfile } from "../api.js";
import { getUser, requireAuth, saveSession } from "../auth.js";
import { initProfileMenu } from "../profile-menu.js";
import { initSearchBar } from "../search.js";

if (!requireAuth()) {
  throw new Error("Usuário não autenticado");
}

const profileBtn = document.getElementById("profile-btn");
const form = document.getElementById("profile-form");
const nameInput = document.getElementById("profile-name");
const emailInput = document.getElementById("profile-email");
const currentPasswordInput = document.getElementById("profile-current-password");
const newPasswordInput = document.getElementById("profile-new-password");
const errorEl = document.getElementById("profile-error");
const successEl = document.getElementById("profile-success");

initSearchBar();
initProfileMenu(profileBtn);

const showError = (message) => {
  errorEl.textContent = message;
  errorEl.hidden = !message;
  successEl.hidden = true;
};

const showSuccess = (message) => {
  successEl.textContent = message;
  successEl.hidden = !message;
  errorEl.hidden = true;
};

const fillForm = (user) => {
  nameInput.value = user.name || "";
  emailInput.value = user.email || "";
};

const loadProfile = async () => {
  const cached = getUser();

  if (cached) {
    fillForm(cached);
  }

  try {
    const data = await getMe();
    fillForm(data.user);
  } catch (error) {
    showError(error.message);
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");
  showSuccess("");

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim()
  };

  const newPassword = newPasswordInput.value;
  const currentPassword = currentPasswordInput.value;

  if (newPassword) {
    payload.newPassword = newPassword;
    payload.currentPassword = currentPassword;
  }

  try {
    const data = await updateProfile(payload);
    saveSession(data.token, data.user);
    profileBtn.textContent = data.user.name?.split(" ")[0] || "Perfil";
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    showSuccess(data.message || "Perfil atualizado com sucesso.");
  } catch (error) {
    showError(error.message);
  }
});

loadProfile();
