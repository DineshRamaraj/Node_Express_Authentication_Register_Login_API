const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const dbPath = path.join(__dirname, "userData.db");
let database = null;
app.use(express.json());

initializationDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializationDbAndServer();

// REGISTER USER POST API

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const selectUserQuery = `
    SELECT
        *
    FROM
        user
    WHERE
        username='${username}';
    `;

  const dbUser = await database.get(selectUserQuery);

  if (dbUser === undefined) {
    if (password.length >= 5) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const createUserDetails = `
            INSERT INTO
                user(username, password, name, gender, location)
            VALUES ('${username}', '${hashedPassword}', '${name}', '${gender}', '${location}');`;

      await database.run(createUserDetails);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// LOGIN USER POST API

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `
        SELECT
            *
        FROM
            user
        WHERE
            username = '${username}';`;

  const dbUser = await database.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatch === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// CHANGE PASSWORD PUT USER API

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  if (newPassword.length >= 5) {
    const selectUserQuery = `
        SELECT
            *
        FROM
            user
        WHERE
            username = '${username}';`;

    const dbUser = await database.get(selectUserQuery);

    const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);

    if (isPasswordMatch === true) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
            UPDATE
                user
            SET
                password = '${hashedPassword}'
            WHERE
                username = '${username}';`;

      const dbUser = await database.run(updatePasswordQuery);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  } else {
    response.status(400);
    response.send("Password is too short");
  }
});

module.exports = app;
