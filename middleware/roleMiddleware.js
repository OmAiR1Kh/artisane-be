/**
 * Middleware to restrict access to specific user roles
 * @param {...String} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // User must be authenticated first (protect middleware should be used before this)
    if (!req.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = { restrictTo };
