const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const MemoryStore = require("memorystore")(session);

require("dotenv").config();

// DB models
const User = require("./models/User");
const Wiki = require("./models/Wiki");

// initialize new express app
const app = express();

// set template engine to ejs
app.set("view engine", "ejs");

// serve static files located in public directory testing
app.use(express.static(path.join(__dirname, "public")));

app.engine("html", require("ejs").renderFile);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    secret: "keyboard cat",
    saveUninitialized: true,
  })
);

app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// main page
app.get("/map", function (req, res) {
  res.render("map", {
    user: req.session.user,
    KAKAO_MAP_JAVASCRIPT_KEY:
      process.env.KAKAO_MAP_JAVASCRIPT_KEY ||
      "64e36d7df07a48189e25336dc4137d96",
  });
});

app.get("/", function (req, res) {
  res.render("home", {
    user: req.session.user,
  });
});

app.get("/login", function (req, res) {
  if (req.session.user && req.session.expires > Date.now()) {
    return res.redirect("/");
  }
  res.render("login");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.post("/login", async function (req, res) {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    bcrypt.compare(password, user.password, (err, valid) => {
      if (valid) {
        req.session.user = user;
        req.session.expires = Date.now() + 60 * 60 * 1000;
        res.redirect("/");
      } else {
        res.render("login", {
          error: "Username or password is incorrect",
        });
      }
    });
  } catch (e) {
    res.render("login", { error: "Username or password is incorrect" });
  }
});

app.post("/signup", async function (req, res) {
  const { username, password, email, profile } = req.body;
  if (!username) {
    return res.status(400).send("Missing username");
  }
  if (!password) {
    return res.status(400).send("Missing password");
  }
  if (!email) {
    return res.status(400).send("Missing email");
  }
  if (!profile) {
    return res.status(400).send("Missing profile");
  }
  const duplicate_user = await User.findOne({ username });
  if (duplicate_user) {
    return res.status(400).send("Username already taken");
  } else {
    try {
      bcrypt.hash(password, 3, async (err, hash) => {
        if (err) {
          return res.status(500).send(err);
        }
        try {
          const new_user = new User({
            username,
            password: hash,
            email,
            profile,
          });
          await new_user.save();
          return res.status(200).send("OK");
        } catch (e) {
          return res.status(500).send(e);
        }
      });
    } catch (e) {
      return res.status(500).send(e);
    }
  }
});

app.get("/wiki", function (req, res) {
  res.render("wiki");
});

app.get("/wiki/a", function (req, res) {
  res.render("encyclopedia");
});

app.get("/scan", (req, res) => {
  res.render("scan", {
    user: req.session.user,
  });
});

const port = process.env.PORT || 3000;

const MONGODB_URI =
  "mongodb+srv://ipproject:ipproject@project.bwchbws.mongodb.net/ipproject?retryWrites=true&w=majority";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server started at http://localhost:${port}`);
    });
  })
  .catch((e) => {
    console.log(e);
  });
