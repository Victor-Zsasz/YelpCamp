const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const passportLocal = require("passport-local");
const cors = require('cors');
const request = require('request');
const catchAsync = require("./utilities/catchAsync");
const ExpressError = require("./utilities/ExpressError");

const Campground = require("./Models/campground") //importing Models file
const Review = require("./Models/review");
const { campgroundSchema, reviewSchema } = require("./schemas.js");
const User = require("./Models/user");

const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");

mongoose.connect("mongodb://localhost:27017/YelpCamp", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Database connected!");
});

const app = express();

app.engine("ejs", ejsMate);  // using ejs-mate engine
app.set("view engine", "ejs"); //template engine
app.set("views",path.join(__dirname,"ejsDirectory")) //defining path of directory of engine files

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })) //to parse req.body
app.use(methodOverride("_method"));
app.use(cors());

const sessionConfig = {
    secret: "boom",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //Date.now gives us time in mili second  
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//*******************************************************************************

app.use((req, res, next) => {
    // console.log("req.session ", req.session);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
})

app.use("/", campgroundRoutes);
app.use("/", reviewRoutes);
app.use("/", userRoutes);

app.get("/", (req, res) => {
    res.send("Hello from Yelp Camp");
})

app.get('/boom', async (req, res) => {
    let data = 0;
    // const Campgrounds = await Campground.find({});
    // console.log(Campgrounds);
    console.log('*****************We are in Node boom****************************')
    // res.send(Campgrounds);
    // res.send('Boom!!')
    await request('http://api.weatherapi.com/v1/current.json?key=6f0f9f3dc76b421d92463717211810&q=Bengaluru&aqi=yes', function (err, res, body) {
        if (err) {
            console.log('Error: ', error);
        } else {
            data = JSON.stringify(body);
            console.log(data);
        }
    });
    res.send(data);
})

app.all("*", (req, res, next) => {
    next(new ExpressError("Page not found", 404));
})

app.use((err, req, res, next) => {
    const { statusCode = 500, message } = err;
    res.locals.error = err;
    // const status = err.status || 500;
    res.status(statusCode).send(message);
    // res.send("Something went wrong!");
})

app.listen(8080, () => {
    console.log("Listening localhost 8080");
})