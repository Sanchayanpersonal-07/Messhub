import jwt from "jsonwebtoken";

/* ================= VERIFY TOKEN ================= */

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      msg: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        msg: "JWT secret not configured",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      msg: "Invalid or expired token",
    });
  }
};

/* ================= ROLE ACCESS CONTROL ================= */

export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        msg: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        msg: "Access denied",
      });
    }

    next();
  };
};
