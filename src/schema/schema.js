const { authorizeRequest } = require('../utils/authorization');
const { gql } = require('apollo-server-express');
const { comparePassword, generateHash } = require('../utils/bcrypt');
const { generateToken, verifyToken } = require('../utils/jwt');
const db = require('../integration/database.js');

const User = db.models.User;
const Event = db.models.Event;
const EventAttendee = db.models.EventAttendee;

const sequelize = db.sequelize;

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    password: String!
    createdEvents: [Event!]!
    attendedEvents: [Event!]!
  }

  type Event {
    id: ID!
    name: String!
    date: String!
    location: String!
    creator: User!
    attendees: [User!]!
  }

  type Query {
    events: [Event!]!
    event(id: ID!): Event
    user: User
  }

  type Mutation {
    registerUser(username: String!, password: String!): String
    loginUser(username: String!, password: String!): String
    createEvent(name: String!, date: String!, location: String!): Event
    updateEvent(id: ID!, name: String!, date: String!, location: String!): Event
    deleteEvent(id: ID!): Event
    updateEventAttendance(eventId: ID!, status: String!): Event
  }
`;

const resolvers = {
  Query: {
    /**
     * Returns a list of all events.
     * @param {*} _ parent
     * @param {*} _ args
     * @param {*} param2 The context.
     * @returns {Promise<Array<Event>>} All the events.
     */
    events: async (_, _, { token }) => {
      return await sequelize.transaction(async (transaction) => {
        authorizeRequest(token);
        const events = await Event.findAll({ transaction });
        return events;
      });
    },

    /**
     * Returns an event by id.
     * @param {*} _ parent
     * @param {*} param1 The arguments passed to the query.
     * @param {*} param2 The context.
     * @returns {Promise<Event>} The event with the given id.
     */
    event: async (_, { id }, { token }) => {
      return await sequelize.transaction(async (transaction) => {
        authorizeRequest(token);
        const event = await Event.findByPk(id, { transaction });
        return event;
      });
    },

    /**
     * Returns the currently logged-in user.
     * @param {*} _ parent
     * @param {*} _ args
     * @param {*} param2 The context.
     * @returns {Promise<User>} The currently logged-in user.
     */
    user: async (_, __, { token }) => {
      return await sequelize.transaction(async (transaction) => {
        authorizeRequest(token);
        const decodedToken = verifyToken(token);
        const user = await User.findByPk(decodedToken.id, { transaction });
        return user;
      });
    },
  },

  Mutation: {
    /**
     * Registers a new user.
     * @param {*} _ parent
     * @param {*} param1 args
     * @returns {Promise<String>} The authentication token for the new user.
     */
    registerUser: async (_, { username, password }) => {
      return await sequelize.transaction(async (transaction) => {
        const hashedPassword = await generateHash(password);
        const user = await User.create(
          { username, password: hashedPassword },
          { transaction }
        );
        const token = generateToken(user);
        return token;
      });
    },

    /**
     * Authenticates a user and returns an authentication token.
     * @param {*} _ parent
     * @param {*} param1 args
     * @returns {Promise<String>} The authentication token for the authenticated user.
     */
    loginUser: async (_, { username, password }) => {
      return await sequelize.transaction(async (transaction) => {
        const user = await User.findOne(
          { where: { username } },
          { transaction }
        );
        if (!user) {
          throw new Error('Invalid login credentials');
        }
        const validPassword = await comparePassword(password, user.password);
        if (!validPassword) {
          throw new Error('Invalid login credentials');
        }
        const token = generateToken(user);
        return token;
      });
    },

    /**
     * Creates a new event.
     * @param {*} _ parent
     * @param {*} param1 args
     * @param {*} param2 The context.
     * @returns {Promise<Event>} The newly created event.
     */
    createEvent: async (_, { name, date, location }, { token }) => {
      return await sequelize.transaction(async () => {
        authorizeRequest(token);
        const userId = verifyToken(token).id;
        const event = await Event.create({
          name,
          date,
          location,
          creatorId: userId,
        });
        return event;
      });
    },

    /**
     * Updates an existing event.
     * @param {*} _ parent
     * @param {*} param1 args
     * @param {*} param2 The context.
     * @returns {Promise<void>}
     */
    updateEvent: async (_, { id, name, date, location }, { token }) => {
      return await sequelize.transaction(async () => {
        authorizeRequest(token);
        await Event.update(
          {
            name,
            date,
            location,
          },
          { where: { id } }
        );
      });
    },

    /**
     * Deletes an event by its ID.
     * @param {*} _ parent
     * @param {*} param1 args
     * @param {*} param2 The context.
     * @returns {Promise<void>}
     */
    deleteEvent: async (_, { id }, { token }) => {
      return await sequelize.transaction(async () => {
        authorizeRequest(token);
        await Event.destroy({ where: { id } });
      });
    },

    /**
     * Updates the attendance status of an event for the authenticated user.
     * @param {*} _ parent
     * @param {*} param1 args
     * @param {*} param2 The context.
     * @returns {Promise<void>}
     */
    updateEventAttendance: async (_, { eventId, status }, { token }) => {
      return await sequelize.transaction(async () => {
        authorizeRequest(token);
        const userId = verifyToken(token).id;
        if (status === 'ATTEND') {
          await EventAttendee.create({ userId, eventId });
        } else {
          await EventAttendee.destroy({ where: { userId, eventId } });
        }
      });
    },
  },
  User: {
    /**
     * Returns a list of events created by the user.
     * @param {*} parent The parent object.
     * @returns {Promise<Array<Event>>} The events created by the user.
     */
    createdEvents: async (parent) => {
      return await sequelize.transaction(async (transaction) => {
        const events = await Event.findAll({
          where: { creatorId: parent.id },
          transaction,
        });
        return events;
      });
    },

    /**
     * Returns a list of events attended by the user.
     * @param {*} parent The parent object.
     * @returns {Promise<Array<Event>>} The events attended by the user.
     */
    attendedEvents: async (parent) => {
      return await sequelize.transaction(async (transaction) => {
        const user = await User.findByPk(parent.id, {
          include: [{ model: Event, through: EventAttendee }],
          transaction,
        });
        const attendedEvents = user.Events;
        return attendedEvents;
      });
    },
  },

  Event: {
    /**
     * Returns the user who created the event.
     * @param {*} parent The parent object.
     * @returns {Promise<User>} The user who created the event.
     */
    creator: async (parent) => {
      return await sequelize.transaction(async (transaction) => {
        const user = await User.findByPk(parent.creatorId, { transaction });
        return user;
      });
    },

    /**
     * Returns a list of users attending the event.
     * @param {*} parent The parent object.
     * @returns {Promise<Array<User>>} The users attending the event.
     */
    attendees: async (parent) => {
      return await sequelize.transaction(async (transaction) => {
        const attendees = await User.findAll({
          include: [
            {
              model: Event,
              where: { id: parent.id },
              through: { attributes: [] },
            },
          ],
          transaction,
        });
        return attendees;
      });
    },
  },
};

module.exports = { typeDefs, resolvers };
