const {
  createUser,
  findUserByEmail,
  validatePassword,
  signToken
} = require("../services/authService");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Nome, email e senha são obrigatórios"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "A senha deve ter pelo menos 6 caracteres"
      });
    }

    const user = await createUser({ name, email, password });
    const token = signToken(user);

    res.status(201).json({
      message: "Conta criada com sucesso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email e senha são obrigatórios"
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: "Credenciais inválidas"
      });
    }

    const isValid = await validatePassword(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        error: "Credenciais inválidas"
      });
    }

    const token = signToken(user);

    res.json({
      message: "Login realizado",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const me = (req, res) => {
  res.json({
    user: req.user
  });
};

module.exports = {
  register,
  login,
  me
};
