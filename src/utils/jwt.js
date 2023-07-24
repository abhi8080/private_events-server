const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;

module.exports = {
  /**
   * Generates a token from a given user object, using the id as claims.
   * @param {*} user The given user object.
   * @returns The generated token.
   * @throws Will throw an error if the given user object does not contain the required fields.
   */
  generateToken: (user) => {
    if (user.id === undefined) {
      throw new Error('Could not generate token.');
    }
    return jwt.sign({ id: user.id }, jwtSecret);
  },

  /**
   * Verifies that a given token is valid by decoding it with the secret.
   * @param {*} token The given token.
   * @returns The decoded token.
   * @throws Will throw an error if the token is not valid.
   */
  verifyToken: (token) => {
    try {
      const decodedToken = jwt.verify(token, jwtSecret);
      return decodedToken;
    } catch (err) {
      throw new Error('Bad token');
    }
  },
};
