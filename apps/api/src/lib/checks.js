const { checkToken } = require('./jwt');

function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("❌ No Bearer token found");
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const bearer = authHeader.split(' ')[1];
    console.log("🔍 checkSession → raw token:", bearer);

    const decoded = checkToken(bearer);
     console.log("✅ checkSession → decoded JWT:", decoded);
     
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ✅ Attach user info from token to request
    req.user = decoded.data || decoded;

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { authenticateUser };
