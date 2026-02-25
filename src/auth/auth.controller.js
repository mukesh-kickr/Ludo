import { loginUser, registerUser } from "./auth.service.js";

export const register = async (req, res) => {
    try {
        const result = await registerUser(req.body);
      res.status(201).json({
            user: {
                id: result.user._id.toString(),
                email: result.user.email,
                username: result.user.username
            },
            token: result.token
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req, res) => {
  try {
    const { user, token } = await loginUser(req.body);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username
      },
    });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};