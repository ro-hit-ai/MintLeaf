// apps/api/src/lib/checkToken.js
const jwt = require("jsonwebtoken");

function checkToken(token) {
  const bearer = token;

  const b64string = process.env.SECRET;
  const buf = Buffer.from(b64string, "base64"); // Ta-da

  const verified = jwt.verify(bearer, buf);

  return verified;
}

module.exports = { checkToken };
