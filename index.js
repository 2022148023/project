const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const fs = require("fs");
const MongoStore = require("connect-mongo");
const { v4 } = require("uuid");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const https = require("https");

require("dotenv").config();

const options = {
  key: fs.readFileSync("./config/cert.key"),
  cert: fs.readFileSync("./config/cert.crt"),
};

let WIKI_REFERENCE = {};

// DB models
const User = require("./models/User");
const Wiki = require("./models/Wiki");

async function executeCommandAsync(command) {
  try {
    const { stdout, stderr } = await exec(command);
    console.log("Command output:\n", stdout);
    if (stderr) {
      console.error("Command execution error:\n", stderr);
    }
  } catch (error) {
    console.error("Error executing command:\n", error);
  }
}

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
    }
    wiki = await wiki.populate({ path: "users" });
    res.render("encyclopedia", {
      wiki: { ...wiki._doc, id: wiki._doc.id.toString().padStart(4, "0") },
      user: req.session.user,
      KAKAO_JAVASCRIPT_KEY: "1adc9b894b7296ff72529231b45c38cf",
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

app.get("/profile/:username", async (req, res) => {
  try {
    const userQuery = await User.findOne({
      username: req.params.username,
    }).populate({ path: "wikis" });
    let isUser = false;
    let rank = 1;
    if (req.session.user && userQuery.equals(req.session.user._id)) {
      isUser = true;
    }
    if (userQuery.wikis.length >= 30) {
      rank = 3;
    } else if (userQuery.wikis.length >= 15) {
      rank = 2;
    }
    res.render("profile", {
      user: req.session.user,
      userData: {
        ...userQuery._doc,
        isUser,
        rank,
      },
    });
  } catch (e) {
    return res.status(500).send(e);
  }
});

app.get("/profile/:username/settings", (req, res) => {
  if (req.session.user && req.params.username === req.session.user.username) {
    res.render("profile-edit", {
      user: req.session.user,
    });
  } else {
    return res.redirect("/logout");
  }
});

app.post("/profile/:username/settings", async (req, res) => {
  if (req.session.user && req.params.username === req.session.user.username) {
    const { bio, email, password, profile } = req.body;
    bcrypt.hash(password || "1", 3, async (err, hash) => {
      try {
        const user = await User.findOneAndUpdate(
          { username: req.session.user.username },
          {
            bio: bio || req.session.user.bio,
            email: email || req.session.user.email,
            password: password ? hash : req.session.user.password,
            profile: profile || req.session.user.profile,
          }
        );
        await user.save();
        return res.redirect(`/profile/${req.session.user.username}`);
      } catch (e) {
        return res.status(500).send(e);
      }
    });
  } else {
    return res.redirect("/logout");
  }
});

const isLogged = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    return res.status(403).send("You need to login first");
  }
};

const TYPES = {
  "toilet tissue": "두루마리 휴지",
  "paper towel": "두루마리 휴지",
  basketball: "농구공",
  "soccer ball": "축구공",
  baseball: "야구공",
  television: "TV",
  refrigerator: "냉장고",
  "remote control": "리모컨",
  mouse: "마우스",
  banana: "바나나",
  pineapple: "파인애플",
  backpack: "백팩",

  "digital watch": "손목 시계",
  "bath towel": "수건",
  "dial telephone": "아이폰",
  "cellular telephone": "갤럭시 스마트폰",

  "running shoe": "신발",
  "folding chair": "의자",
  "rocking chair": "의자",
  "barber chair": "의자",
  sweatshirt: "와이셔츠",
  "milk can": "코카콜라 캔",

  "rubber eraser": "지우개",
  "comic book": "책",
  notebook: "책",
  laptop: "노트북",
  "prairie chicken": "치킨",
  "water bottle": "페트병",
  "beer bottle": "소주병",

  "car mirror": "거울",
  "pop bottle": "페트병",
  "soup bowl": "도자기 그릇",
  spotlight: "전구",

  cup: "종이컵",

  paintbrush: "칫솔",

  packet: "우유팩",
};

app.post("/checkWiki", isLogged, (req, res) => {
  const { image } = req.body;
  const buffer = Buffer.from(image, "base64");
  const filename = `${v4()}.jpg`;
  const filePath = `./ai/${filename}`;
  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      return res.status(500).send("Error storing the image");
    }
    const command = `python ./ai/script.py ${filename} > ./ai/${
      filename.split(".")[0] + ".txt"
    }`;
    console.log(command);
    exec(command, (error, stdout, stderr) => {
      fs.access(
        `./ai/${filename.split(".")[0] + ".txt"}`,
        fs.constants.F_OK,
        (err) => {
          if (err) {
            return console.log(err);
          }
          // Read the file contents
          fs.readFile(
            `./ai/${filename.split(".")[0] + ".txt"}`,
            "utf8",
            async (err, data) => {
              if (err) {
                return console.log(err);
              }
              const types = data
                .split("\n")
                .filter((text) => text.length > 0)
                .map((type) => type.split("\r")[0])
                .map((type1) => TYPES[type1]);
              let newWiki = null;
              console.log(data);
              console.log("types", types);
              for (type of types) {
                if (type !== "None" && WIKI_REFERENCE.hasOwnProperty(type)) {
                  // add wiki to user
                  let wiki = await Wiki.findOne({ id: WIKI_REFERENCE[type] });
                  console.log(wiki);
                  if (!wiki.users.includes(req.session.user._id)) {
                    wiki.users = [...wiki._doc.users, req.session.user._id];
                    newWiki = wiki._doc;
                    await wiki.save();
                  }
                  let user = await User.findById(req.session.user._id);
                  if (!user.wikis.includes(wiki._id)) {
                    user.wikis = [wiki._id, ...user.wikis];
                  }
                  await user.save();
                }
              }
              return res.status(200).send({ newWiki });
            }
          );
        }
      );
    });
  });
});

const port = process.env.PORT || 8000;

const MONGODB_URI =
  "mongodb+srv://ipproject:ipproject@project.bwchbws.mongodb.net/ipproject?retryWrites=true&w=majority";

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    // await addWikisToDB();
    const wikis = await Wiki.find({});
    for (wiki of wikis) {
      WIKI_REFERENCE[wiki.name] = wiki.id;
    }
    console.log(WIKI_REFERENCE);
    /*     app.listen(port, () => {
      console.log(`Server started at http://localhost:${port}`);
    }); */

    https.createServer(options, app).listen(8000, () => {
      console.log(`Server started at https://localhost:8000`);
    });
  })
  .catch((e) => {
    console.log(e);
  });
