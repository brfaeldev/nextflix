const TOKEN_KEY = "nextflix_token";
const USER_KEY = "nextflix_user";

export const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const isLoggedIn = () => Boolean(getToken());

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const requireAuth = () => {
  if (!isLoggedIn()) {
    window.location.href = "./login.html";
    return false;
  }
  return true;
};

export const redirectIfLoggedIn = () => {
  if (isLoggedIn()) {
    window.location.href = "./home.html";
  }
};
