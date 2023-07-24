const { verifyToken } = require('./jwt');
module.exports = {
  /**
   * Authorizes a request by verifying the token.
   * Throws an error if the token is invalid
   * @param {String} token The token to verify.
   */
  authorizeRequest: (token) => {
    if (!token) {
      throw new Error('No token');
    }
    verifyToken(token);
  },
};
