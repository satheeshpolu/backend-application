const { verify } = require("jsonwebtoken");
const { createError } = require("../middleware/errorHandler");

/**
 * JWT Authentication Middleware
 * Validates Bearer token from Authorization header
 */
const authenticate = (req, res, next) => {
  const authorizationHeader = req.get("authorization");
  
  if (!authorizationHeader) {
    return res.status(401).json({
      success: false,
      error: {
        statusCode: 401,
        message: "Unauthorized: No token provided",
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Check for Bearer token format
  if (!authorizationHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        statusCode: 401,
        message: "Unauthorized: Invalid token format. Use 'Bearer <token>'",
      },
      timestamp: new Date().toISOString(),
    });
  }

  const token = authorizationHeader.slice(7);
  const jwtSecret = process.env.JWT_SECRET || "change-this-secret-in-production";

  try {
    const decoded = verify(token, jwtSecret);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    let message = "Invalid token";
    
    if (err.name === "TokenExpiredError") {
      message = "Token has expired";
    } else if (err.name === "JsonWebTokenError") {
      message = "Invalid token";
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
 * Optional authentication - attaches user if token present, continues if not
 */
const optionalAuth = (req, res, next) => {
  const authorizationHeader = req.get("authorization");
  
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authorizationHeader.slice(7);
  const jwtSecret = process.env.JWT_SECRET || "change-this-secret-in-production";

  try {
    const decoded = verify(token, jwtSecret);
    req.user = decoded;
  } catch (err) {
    // Token invalid, but continue without user
  }
  
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  // Keep legacy export for backward compatibility
  checkJWTToken: authenticate,
};
