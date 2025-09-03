require('dotenv').config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const { sequelize } = require("./configs/db"); 
const app = express();
const methodOverride = require("method-override");


const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require('./routes/userRoutes');
const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/commentRoutes");

app.use(methodOverride("_method"));

// Create the session store instance
const sessionStore = new SequelizeStore({
  db: sequelize,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
  extendDefaultFields: (defaults, session) => {
    return {
      ...defaults,
      userId: session.userId || null,
    };
  },
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, "../uploads")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_default_secret_key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000, 
      sameSite: 'strict' 
    },
    name: 'sessionId' 
  })
);


app.use((req, res, next) => {
 
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
 res.set('Expires', '0');
  next();
});


app.use((req, res, next) => {
  req.models = require("./models");
  next();
});


app.get('/', (req, res) => {
  res.render('home');
});

app.use(express.static(__dirname + '/../'));

app.use('/user', userRoutes);
app.use("/admin", adminRoutes);
app.use("/comments", commentRoutes);
app.use("/", authRoutes);

module.exports = app;