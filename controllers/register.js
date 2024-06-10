const bcrypt = require("bcrypt");
const registerRouter = require("express").Router();
const User = require("../models/user");
const Folder = require("../models/folder");

registerRouter.post("/", async (request, response) => {
  const { username, email, password } = request.body;

  if (!email || !username || !password) {
    return response
      .status(400)
      .json({ error: "Email, username or password missing" });
  }

  const existingUser = await User.findOne({ username: username.toLowerCase() });
  if (existingUser) {
    return response
      .status(400)
      .json({ error: "Username already exists, choose another one" });
  }
  if (password.length < 8) {
    return response
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username: username.toLowerCase(),
    email,
    passwordHash,
  });

  const rootFolder = new Folder({
    name: "root",
    url: "/home",
    userId: user._id,
  });

  const savedUser = await user.save();
  await rootFolder.save();

  response.status(201).json(savedUser);
});

module.exports = registerRouter;
