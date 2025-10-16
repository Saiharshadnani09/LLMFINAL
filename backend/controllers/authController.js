// controllers/authController.js
export const register = async (req, res) => {
  const { username, email, password, role } = req.body || {};
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "username, email, password, role are required" });
  }
  // No DB yet — just echo back
  return res.json({
    message: "Stub register OK",
    user: { username, email, role }
  });
};

export const login = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }
  // No DB yet — just pretend login succeeded
  return res.json({
    message: "Stub login OK",
    token: "stub-token",
    user: { username }
  });
};
