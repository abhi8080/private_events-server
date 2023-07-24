/**
 * The database configuration module containing the options that
 * are used by the integration layer to create a connection to
 * the database.
 */

module.exports = {
  HOST: process.env.DATABASE_HOST,
  PORT: process.env.DATABASE_PORT,
  USERNAME: process.env.DATABASE_USERNAME,
  PASSWORD: process.env.DATABASE_PASSWORD,
  NAME:
    process.env.NODE_ENV === 'acctest'
      ? process.env.DATABASE_ACC_NAME
      : process.env.DATABASE_NAME,
  DIALECT: process.env.DATABASE_DIALECT,
};
