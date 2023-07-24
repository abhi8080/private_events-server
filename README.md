# PrivateEvents-server

This is the backend built with Express.js for the Private Events application. The backend implements the GraphQL API, providing a powerful and flexible way to interact with the application.

## Prerequisites

- Node and npm must be installed on the local system.
- An instance of a database (e.g. PostgreSQL) must be set up and accessible.

## Installation

1. Clone the repository to your local machine:

   ```bash
   git clone https://github.com/abhi8080/private_events-server.git
   ```

2. Navigate to the project directory:

   ```bash
   cd private_events-server
   ```

3. Install dependencies

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   The backend server will now be running at `http://localhost:5001/graphql`.

## Usage

The backend exposes a GraphQL API with the following queries and mutations:

### Queries:

- `events`: Returns a list of all events.
- `event`: Returns an event by its ID.
- `user`: Returns the currently logged-in user.

### Mutations:

- `registerUser`: Registers a new user and returns an authentication token.
- `loginUser`: Authenticates a user and returns an authentication token.
- `createEvent`: Creates a new event.
- `updateEvent`: Updates an existing event.
- `deleteEvent`: Deletes an event by its ID.
- `updateEventAttendance`: Updates the attendance status of an event for the authenticated user.

### Transactions

Transactions are used to ensure data consistency and integrity when performing database operations. Database operations within the `sequelize.transaction` method are wrapped in a transaction, ensuring that they are executed atomically, thus maintaining data consistency and integrity.

### Unit Tests

The backend includes unit tests to ensure the correctness of the application's functionality. The tests cover different scenarios and edge cases to verify that the queries, mutations and database operations are working as expected.

To run the unit tests, use the following command:

```bash
npm run test
```

The tests will be executed, and the results will be displayed in the terminal.

## License

This project is licensed under the [MIT License](LICENSE).
