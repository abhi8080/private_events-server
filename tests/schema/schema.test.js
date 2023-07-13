const { resolvers } = require('../../src/schema/schema');
const db = require('../../src/integration/database.js');
const { generateToken } = require('../../src/utils/jwt');
const { generateHash } = require('../../src/utils/bcrypt');

const User = db.models.User;
const Event = db.models.Event;
const EventAttendee = db.models.EventAttendee;

const mockUser = { id: 1 };
const userToken = generateToken(mockUser);

describe('Queries', () => {
  test('events query should return events', async () => {
    const mockedEvents = [
      { id: 1, name: 'Event 1', date: '2023-06-01', location: 'Test Location' },
      { id: 2, name: 'Event 2', date: '2023-06-02', location: 'Test' },
    ];
    Event.findAll = jest.fn().mockResolvedValue(mockedEvents);

    const context = {
      token: userToken,
    };

    const result = await resolvers.Query.events(undefined, undefined, context);

    expect(result).toEqual(mockedEvents);
    expect(Event.findAll).toHaveBeenCalledTimes(1);
  });

  test('event query should return a specific event', async () => {
    const args = { id: 1 };

    const mockedEvent = {
      id: 1,
      name: 'Event 1',
      date: '2023-06-01',
      location: 'Test Location',
    };

    Event.findByPk = jest.fn().mockResolvedValue(mockedEvent);

    const context = {
      token: userToken,
    };

    const result = await resolvers.Query.event(undefined, args, context);

    expect(result).toEqual(mockedEvent);
    expect(Event.findByPk).toHaveBeenCalledTimes(1);
  });

  test('user query should return a user', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      createdEvents: [],
      attendedEvents: [],
    };

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    const context = {
      token: userToken,
    };

    const result = await resolvers.Query.user(undefined, undefined, context);

    expect(result).toEqual(mockUser);
    expect(User.findByPk).toHaveBeenCalledTimes(1);
  });
});

describe('Mutations', () => {
  test('registerUser mutation should create a new user and return JWT token', async () => {
    const args = { username: 'testuser', password: 'testpassword' };

    const mockUser = {
      id: 1,
      username: 'testuser',
      createdEvents: [],
      attendedEvents: [],
    };
    User.create = jest.fn().mockResolvedValue(mockUser);

    const result = await resolvers.Mutation.registerUser(undefined, args);

    expect(typeof result).toBe('string');
    expect(User.create).toHaveBeenCalledTimes(1);
  });

  test('loginUser mutation should return JWT token', async () => {
    const args = { username: 'testuser', password: 'testpassword' };

    const mockUser = {
      id: 1,
      username: 'testuser',
      password: await generateHash('testpassword'),
      createdEvents: [],
      attendedEvents: [],
    };

    User.findOne = jest.fn().mockResolvedValue(mockUser);

    const result = await resolvers.Mutation.loginUser(undefined, args);

    expect(typeof result).toBe('string');
    expect(User.findOne).toHaveBeenCalledTimes(1);
  });

  test('loginUser mutation should throw an error if there is no user that matches the provided username', async () => {
    const args = { username: 'nonexistentuser', password: 'testpassword' };

    User.findOne = jest.fn().mockResolvedValue(null);

    try {
      await resolvers.Mutation.loginUser(undefined, args);
      fail('An error was not thrown.');
    } catch (err) {
      expect(err.message).toEqual('Invalid login credentials');
    }
  });

  test('loginUser mutation should throw an error if the provided password is wrong', async () => {
    const args = { username: 'testuser', password: 'wrongpassword' };

    const mockUser = {
      id: 1,
      username: 'testuser',
      password: await generateHash('testpassword'),
      createdEvents: [],
      attendedEvents: [],
    };

    User.findOne = jest.fn().mockResolvedValue(mockUser);

    try {
      await resolvers.Mutation.loginUser(undefined, args);
      fail('An error was not thrown.');
    } catch (err) {
      expect(err.message).toEqual('Invalid login credentials');
    }
  });

  test('createEvent mutation should create a new event', async () => {
    const args = {
      name: 'Test Event',
      date: '2023-06-01',
      location: 'Test Location',
    };

    const mockEvent = {
      id: 1,
      name: 'Test Event',
      date: '2023-06-01',
      location: 'Test Location',
    };

    Event.create = jest.fn().mockResolvedValue(mockEvent);

    const context = {
      token: userToken,
    };

    const result = await resolvers.Mutation.createEvent(
      undefined,
      args,
      context
    );

    expect(result).toEqual(mockEvent);
    expect(Event.create).toHaveBeenCalledWith({
      name: args.name,
      date: args.date,
      location: args.location,
      creatorId: mockUser.id,
    });
  });

  test('updateEvent mutation should update an event', async () => {
    const args = {
      id: 1,
      name: 'Test Event',
      date: '2023-06-01',
      location: 'Test Location',
    };

    Event.update = jest.fn();

    const context = {
      token: userToken,
    };

    await resolvers.Mutation.updateEvent(undefined, args, context);

    expect(Event.update).toHaveBeenCalledWith(
      {
        name: args.name,
        date: args.date,
        location: args.location,
      },
      { where: { id: args.id } }
    );
  });

  test('deleteEvent mutation should delete an event', async () => {
    const args = {
      id: 1,
    };

    Event.destroy = jest.fn();

    const context = {
      token: userToken,
    };

    await resolvers.Mutation.deleteEvent(undefined, args, context);

    expect(Event.destroy).toHaveBeenCalledWith({ where: { id: args.id } });
  });

  test('updateEventAttendance mutation should add user attendance to event', async () => {
    const args = {
      eventId: 1,
      status: 'ATTEND',
    };

    EventAttendee.create = jest.fn();

    const context = {
      token: userToken,
    };

    await resolvers.Mutation.updateEventAttendance(undefined, args, context);

    expect(EventAttendee.create).toHaveBeenCalledWith({
      userId: mockUser.id,
      eventId: args.eventId,
    });
  });

  test('updateEventAttendance mutation should remove user attendance from event', async () => {
    const args = {
      eventId: 1,
      status: ' UNATTEND',
    };

    EventAttendee.destroy = jest.fn();

    const context = {
      token: userToken,
    };

    await resolvers.Mutation.updateEventAttendance(undefined, args, context);

    expect(EventAttendee.destroy).toHaveBeenCalledWith({
      where: {
        userId: mockUser.id,
        eventId: args.eventId,
      },
    });
  });
});

describe('User', () => {
  test('createdEvents should return the events that the user has created', async () => {
    const parent = {
      id: 1,
    };
    const mockedEvents = [
      { id: 1, name: 'Event 1', date: '2023-06-01', location: 'Test Location' },
      { id: 2, name: 'Event 2', date: '2023-06-02', location: 'Test' },
    ];
    Event.findAll = jest.fn().mockResolvedValue(mockedEvents);

    const result = await resolvers.User.createdEvents(parent);

    expect(result).toEqual(mockedEvents);
    expect(Event.findAll).toHaveBeenCalledWith({
      where: {
        creatorId: parent.id,
      },
    });
  });

  test('attendedEvents should return the events that the user has attended', async () => {
    const parent = {
      id: 1,
    };
    const mockedUser = {
      Events: [
        {
          id: 1,
          name: 'Event 1',
          date: '2023-06-01',
          location: 'Test Location',
          creatorId: 2,
        },
        {
          id: 2,
          name: 'Event 2',
          date: '2023-06-02',
          location: 'Test',
          creatorId: 2,
        },
      ],
    };

    User.findByPk = jest.fn().mockResolvedValue(mockedUser);

    const result = await resolvers.User.attendedEvents(parent);

    expect(result).toEqual(mockedUser.Events);
    expect(User.findByPk).toHaveBeenCalledWith(parent.id, {
      include: [
        {
          model: Event,
          through: EventAttendee,
        },
      ],
    });
  });
});

describe('Event', () => {
  test('creator should return the user that created the event', async () => {
    const parent = {
      creatorId: 1,
    };

    const mockedUser = {
      id: 1,
      username: 'testuser',
      createdEvents: [
        {
          id: 1,
          name: 'Event 1',
          date: '2023-06-01',
          location: 'Test Location',
        },
      ],
      attendedEvents: [],
    };

    User.findByPk = jest.fn().mockResolvedValue(mockedUser);

    const result = await resolvers.Event.creator(parent);

    expect(result).toEqual(mockedUser);
    expect(User.findByPk).toHaveBeenCalledWith(parent.creatorId);
  });

  test('attendees should return the users that are attending the event', async () => {
    const parent = {
      id: 1,
    };

    const mockAttendees = [
      {
        id: 1,
        username: 'testuser',
        createdEvents: [],
        attendedEvents: [
          {
            id: 1,
            name: 'Event 1',
            date: '2023-06-01',
            location: 'Test Location',
            creatorId: 2,
          },
        ],
      },
      {
        id: 3,
        username: 'testuser2',
        createdEvents: [],
        attendedEvents: [
          {
            id: 1,
            name: 'Event 1',
            date: '2023-06-01',
            location: 'Test Location',
            creatorId: 2,
          },
        ],
      },
    ];

    User.findAll = jest.fn().mockResolvedValue(mockAttendees);

    const result = await resolvers.Event.attendees(parent);

    expect(result).toEqual(mockAttendees);
    expect(User.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: Event,
          where: {
            id: parent.id,
          },
          through: { attributes: [] },
        },
      ],
    });
  });
});
