const { verifyToken } = require('./jwt');
module.exports = {
  authorizeRequest: (token) => {
    if (!token) {
      throw new Error('No token');
    }
    verifyToken(token);
  },
};
