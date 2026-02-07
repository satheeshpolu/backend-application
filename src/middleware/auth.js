/**
 * Authentication Middleware
 * JWT token validation for protected routes
 */
const { verify } = require("jsonwebtoken");
const config = require("../config");

/**
 * Require authentication
 * Returns 401 if no valid token
 */
const authenticate = (req, res, next) => {
  const authHeader = req.get("authorization");
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        statusCode: 401,
        message: "No token provided",
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        statusCode: 401,
        message: "Invalid token format. Use 'Bearer <token>'",
      },
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    let message = "Invalid token";
    
    if (err.name === "TokenExpiredError") {
      message = "Token has expired";
    }

    return res.status(401).json({
      success: false,
      error: {
        statusCode: 401,
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Optional authentication
 * Attaches user if valid token, continues otherwise
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verify(token, config.jwt.secret);
    req.user = decoded;
  } catch (err) {
    // Invalid token, but continue without user
  }
  
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
};
