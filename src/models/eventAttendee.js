module.exports = (sequelize, DataTypes) => {
  const EventAttendee = sequelize.define('EventAttendee', {});

  return EventAttendee;
};
