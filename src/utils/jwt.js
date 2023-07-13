const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;

module.exports = {
  generateToken: (user) => {
    if (user.id === undefined) {
      throw new Error('Could not generate token.');
    }
    return jwt.sign({ id: user.id }, jwtSecret);
  },
  verifyToken: (token) => {
    try {
      const decodedToken = jwt.verify(token, jwtSecret);
      return decodedToken;
    } catch (err) {
      throw new Error('Bad token');
    }
  },
};
