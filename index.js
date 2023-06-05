const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const fs = require("fs");
const MongoStore = require("connect-mongo");
require("dotenv").config();

// DB models
const User = require("./models/User");
const Wiki = require("./models/Wiki");

async function addWikisToDB() {
  fs.readFile("./wikis.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }
    try {
      // Parse the JSON data
      const jsonData = JSON.parse(data);
      jsonData.items.forEach(async (wiki) => {
        const new_wiki = new Wiki({
          id: wiki.id,
          name: wiki.name,
          details: wiki.details,
          trash_type: wiki.trash_type,
          details: wiki.details,
          image: wiki.image,
        });
        try {
          await new_wiki.save();
        } catch (e) {
          console.log(e);
        }
      });
    } catch (err) {
      console.error("Error parsing JSON data:", err);
    }
  });
}

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
    store: new MongoStore({
      mongoUrl:
        "mongodb+srv://ipproject:ipproject@project.bwchbws.mongodb.net/sessionstore",
      ttl: 86400,
    }),
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  console.log(req.session);
  next();
});

app.set("views", path.join(__dirname, "views"));

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
        req.session.user = user._doc;
        res.redirect("/");
      } else {
        res.render("login", {
          error: "아이디나 비밀번호가 일치하지 않습니다.",
        });
      }
    });
  } catch (e) {
    res.render("login", { error: "아이디나 비밀번호가 일치하지 않습니다." });
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

app.get("/wiki", async function (req, res) {
  try {
    let wikis = await Wiki.find({});
    const user = req.session.user || null;

    wikis = wikis
      .sort((wiki1, wiki2) => wiki1._doc.id - wiki2._doc.id)
      .map((wiki) => ({
        ...wiki._doc,
        id: wiki._doc.id.toString().padStart(4, "0"),
        hidden: user ? (wiki.users.includes(user._id) ? false : true) : true,
      }));
    res.render("wikis", { wikis, user: req.session.user });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/wiki/:id", async function (req, res) {
  try {
    const user = req.session.user || null;
    let wiki = await Wiki.findById(req.params.id);
    if (user) {
      if (!wiki.users.includes(user._id)) {
        wiki.users = [...wiki._doc.users, user._id];
        await wiki.save();
      }
    }
    wiki = await wiki.populate({ path: "users" });
    res.render("encyclopedia", {
      wiki: { ...wiki._doc, id: wiki._doc.id.toString().padStart(4, "0") },
      user: req.session.user,
    });
  } catch (e) {
    res.status(500).send(e);
  }
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
  .then(async () => {
    // await addWikisToDB();
    app.listen(port, () => {
      console.log(`Server started at http://localhost:${port}`);
    });
  })
  .catch((e) => {
    console.log(e);
  });
