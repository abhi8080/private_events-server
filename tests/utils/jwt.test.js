const { generateToken, verifyToken } = require('../../src/utils/jwt');

describe('tests for generateToken', () => {
  test('should throw an error if user has no id', () => {
    expect(() => {
      generateToken({});
    }).toThrow('Could not generate token.');
  });
});

describe('tests for verifyToken', () => {
  test('should throw an error if token is invalid', () => {
    expect(() => {
      verifyToken('invalid token');
    }).toThrow('Bad token');
  });
});
