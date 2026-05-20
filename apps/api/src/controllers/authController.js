const bcrypt = require("bcryptjs");
const { withDb, get, run } = require("../db/database");
const { signToken } = require("../middleware/auth");

const APP_USER_ID_START = 100000;

async function nextUserId(db) {
  const row = await get(
    db,
    "SELECT COALESCE(MAX(id), ?) AS max_id FROM users",
    [APP_USER_ID_START - 1]
  );
  return Math.max(row.max_id + 1, APP_USER_ID_START);
}

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Senha deve ter ao menos 6 caracteres." });
  }

  try {
    await withDb(async (db) => {
      const exists = await get(db, "SELECT id FROM users WHERE email = ?", [
        email.toLowerCase(),
      ]);
      if (exists) {
        res.status(409).json({ error: "Email já cadastrado." });
        return;
      }

      const userId = await nextUserId(db);
      const passwordHash = await bcrypt.hash(password, 10);
      const now = Math.floor(Date.now() / 1000);

      await run(
        db,
        `INSERT INTO users (id, name, email, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, name.trim(), email.toLowerCase(), passwordHash, now]
      );

      const user = { id: userId, name: name.trim(), email: email.toLowerCase() };
      res.status(201).json({ user, token: signToken(user) });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao cadastrar." });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }

  try {
    await withDb(async (db) => {
      const user = await get(
        db,
        "SELECT id, name, email, password_hash FROM users WHERE email = ?",
        [email.toLowerCase()]
      );

      if (!user) {
        res.status(401).json({ error: "Credenciais inválidas." });
        return;
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        res.status(401).json({ error: "Credenciais inválidas." });
        return;
      }

      const payload = { id: user.id, name: user.name, email: user.email };
      res.json({ user: payload, token: signToken(payload) });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao entrar." });
  }
}

module.exports = { register, login };
