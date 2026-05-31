const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/connection");

const JWT_SECRET = process.env.JWT_SECRET || "nextflix-dev-secret";
const JWT_EXPIRES_IN = "7d";

const createUser = ({ name, email, password }) =>
  new Promise(async (resolve, reject) => {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        `INSERT INTO users (name, email, password)
         VALUES (?, ?, ?)`,
        [name, email, hashedPassword],
        function (err) {
          if (err) {
            if (err.message.includes("UNIQUE")) {
              return reject(new Error("Email já cadastrado"));
            }
            return reject(err);
          }

          resolve({
            id: this.lastID,
            name,
            email
          });
        }
      );
    } catch (error) {
      reject(error);
    }
  });

const findUserByEmail = (email) =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT id, name, email, password
       FROM users
       WHERE email = ?`,
      [email],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

const findUserById = (id) =>
  new Promise((resolve, reject) => {
    db.get(
      `SELECT id, name, email, password
       FROM users
       WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });

const updateUser = async ({
  id,
  name,
  email,
  currentPassword,
  newPassword
}) => {
  const user = await findUserById(id);

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  const nextName = name?.trim() || user.name;
  const nextEmail = email?.trim() || user.email;

  if (nextEmail !== user.email) {
    const existing = await findUserByEmail(nextEmail);

    if (existing && existing.id !== id) {
      throw new Error("Email já cadastrado");
    }
  }

  let nextPasswordHash = user.password;

  if (newPassword) {
    if (!currentPassword) {
      throw new Error("Informe a senha atual para alterá-la");
    }

    const matches = await validatePassword(currentPassword, user.password);

    if (!matches) {
      throw new Error("Senha atual incorreta");
    }

    if (newPassword.length < 6) {
      throw new Error("A nova senha deve ter pelo menos 6 caracteres");
    }

    nextPasswordHash = await bcrypt.hash(newPassword, 10);
  }

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users
       SET name = ?, email = ?, password = ?
       WHERE id = ?`,
      [nextName, nextEmail, nextPasswordHash, id],
      (err) => {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return reject(new Error("Email já cadastrado"));
          }
          return reject(err);
        }

        resolve({
          id,
          name: nextName,
          email: nextEmail
        });
      }
    );
  });
};

const validatePassword = (password, hash) => bcrypt.compare(password, hash);

const signToken = (user) =>
  jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  validatePassword,
  signToken,
  verifyToken
};
