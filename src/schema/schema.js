const { authorizeRequest } = require('../utils/authorization');
const { gql } = require('apollo-server-express');
const { comparePassword, generateHash } = require('../utils/bcrypt');
const { generateToken, verifyToken } = require('../utils/jwt');
const db = require('../integration/database.js');

const User = db.models.User;
const Event = db.models.Event;
const EventAttendee = db.models.EventAttendee;

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
    events: async (parent, args, { token }) => {
      authorizeRequest(token);
      const events = await Event.findAll();
      return events;
    },
    event: async (_, { id }, { token }) => {
      authorizeRequest(token);
      const event = await Event.findByPk(id);
      return event;
    },
    user: async (_, __, { token }) => {
      authorizeRequest(token);
      const decodedToken = verifyToken(token);
      const user = await User.findByPk(decodedToken.id);
      return user;
    },
  },
  Mutation: {
    registerUser: async (_, { username, password }) => {
      const hashedPassword = await generateHash(password);
      const user = await User.create({
        username,
        password: hashedPassword,
      });
      const token = generateToken(user);

      return token;
    },
    loginUser: async (_, { username, password }) => {
      const user = await User.findOne({ where: { username } });
      if (!user) {
        throw new Error('Invalid login credentials');
      }
      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) {
        throw new Error('Invalid login credentials');
      }
      const token = generateToken(user);

      return token;
    },
    createEvent: async (_, { name, date, location }, { token }) => {
      authorizeRequest(token);
      const userId = verifyToken(token).id;
      const event = await Event.create({
        name,
        date,
        location,
        creatorId: userId,
      });
      return event;
    },

    updateEvent: async (_, { id, name, date, location }, { token }) => {
      authorizeRequest(token);
      await Event.update(
        {
          name,
          date,
          location,
        },
        { where: { id } }
      );
    },

    deleteEvent: async (_, { id }, { token }) => {
      authorizeRequest(token);
      await Event.destroy({ where: { id } });
    },

    updateEventAttendance: async (_, { eventId, status }, { token }) => {
      authorizeRequest(token);
      const userId = verifyToken(token).id;
      if (status === 'ATTEND') {
        await EventAttendee.create({ userId, eventId });
      } else {
        await EventAttendee.destroy({ where: { userId, eventId } });
      }
    },
  },
  User: {
    createdEvents: async (parent) => {
      const events = await Event.findAll({
        where: { creatorId: parent.id },
      });
      return events;
    },
    attendedEvents: async (parent) => {
      const user = await User.findByPk(parent.id, {
        include: [
          {
            model: Event,
            through: EventAttendee,
          },
        ],
      });

      const attendedEvents = user.Events;

      return attendedEvents;
    },
  },
  Event: {
    creator: async (parent) => {
      const user = await User.findByPk(parent.creatorId);
      return user;
    },
    attendees: async (parent) => {
      const attendees = await User.findAll({
        include: [
          {
            model: Event,
            where: { id: parent.id },
            through: { attributes: [] },
          },
        ],
      });
      return attendees;
    },
  },
};

module.exports = { typeDefs, resolvers };
