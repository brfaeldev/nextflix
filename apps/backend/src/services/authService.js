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
  validatePassword,
  signToken,
  verifyToken
};
