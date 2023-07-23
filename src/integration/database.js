const dbConfig = require('../config/db-config');
const { Sequelize, DataTypes } = require('sequelize');
const defineEventModel = require('../models/event');
const defineUserModel = require('../models/user');
const defineEventAttendeeModel = require('../models/eventAttendee');

let sequelize;

sequelize = new Sequelize(dbConfig.NAME, dbConfig.USERNAME, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.DIALECT,
});

// Define models
const Event = defineEventModel(sequelize, DataTypes);
const User = defineUserModel(sequelize, DataTypes);
const EventAttendee = defineEventAttendeeModel(sequelize, DataTypes);

User.hasMany(Event, { foreignKey: 'creatorId' });
Event.belongsTo(User, { foreignKey: 'creatorId' });
User.belongsToMany(Event, { through: EventAttendee, foreignKey: 'userId' });
Event.belongsToMany(User, { through: EventAttendee, foreignKey: 'eventId' });

// Define exportable
const db = {
  sequelize: sequelize,
  models: {
    Event,
    User,
    EventAttendee,
  },
};

// Start db connection
(async () => {
  try {
    if (process.env.NODE_ENV === 'acctest')
      await sequelize.sync({ force: true });
    else await sequelize.sync();

    await sequelize.authenticate();

    console.log(
      'Connection has been established successfully.'.cyan.underline.bold
    );
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

module.exports = db;
