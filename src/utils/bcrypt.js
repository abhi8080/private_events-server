const bcrypt = require('bcrypt');

module.exports = {
  generateHash: async (password) => {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  },
  comparePassword: async (password, hash) => {
    const isSame = await bcrypt.compare(password, hash);
    return isSame;
  },
};
