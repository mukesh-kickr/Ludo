import jwt from "jsonwebtoken";
export const isAuth = (req, res, next) => {
  const authHeader = req.get("Authorization");
  

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRETE);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
