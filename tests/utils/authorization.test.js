const { authorizeRequest } = require('../../src/utils/authorization');

test('should throw an error if no token is provided', () => {
  expect(() => {
    authorizeRequest('');
  }).toThrow('No token');
});
