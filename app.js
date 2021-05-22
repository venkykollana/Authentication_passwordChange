const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "userData.db");
let db = null;

const initializeServerAndDatabase = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeServerAndDatabase();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const searchUserQuery = `
    SELECT 
        * 
    FROM 
        user 
    WHERE 
        username = '${username}';`;
  const dbUser = await db.get(searchUserQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const harshedPassword = await bcrypt.hash(password, 10);
      const createUserQuery = `
        INSERT INTO user(username, name, password, gender, location)
        VALUES('${username}', '${name}', '${harshedPassword}', '${gender}', '${location}');`;
      const createUser = await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const searchUserQuery = `
    SELECT 
        * 
    FROM 
        user 
    WHERE 
        username = '${username}';`;
  const dbUser = await db.get(searchUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(password, dbUser.password);
    if (passwordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change_password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  hashNewPassword = await bcrypt.hash(newPassword, 10);
  hashOldPassword = await bcrypt.hash(oldPassword, 10);

  const searchUserQuery = `
  SELECT 
        * 
  FROM 
        user 
  WHERE 
        username = '${username}';
    `;
  const dbUser = await db.get(searchUserQuery);
  const password = await bcrypt.compare(oldPassword, dbUser.password);
  if (password === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePasswordQuery = `
          UPDATE 
                user
          SET 
                password = '${hashNewPassword}'
          WHERE 
                username = '${username}';`;
      const updatedPassword = await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
