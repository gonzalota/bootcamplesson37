//jshint esversion:6
require('dotenv').config();   
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//const encrypt = require("mongoose-encryption");
// const { log } = require('console');
// const md5 = require("md5");

const app = express();

//console.log(md5("123456"));

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session()); 

mongoose.connect("mongodb://127.0.0.1/userDB");
// Mongoose 6 "https://mongoosejs.com/docs/migrating_to_6.html#no-more-deprecation-warning-options"
//mongoose.set("useCreateIndex", false);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);

// Esto encripta en la base de datos. Ver archivo .env leer mongoose-encryption (documentación) //
// const secret = "Thisisourlittlesecret.";
// Al empezar a hacer el hashing lo has quitado.
//userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    User.find({"secret": {}})
        .then((foundUsers) => {
            if(foundUsers) {
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;

    console.log(req.user.id);

    User.findById(req.user.id, (req, res))
        .then((foundUser) => {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(() => {
                    res.redirect("/secrets");
                });
            }
        })
        .catch((err) => {
            console.log(err);
        });
    })

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) { return next(err); }
      else { 
        res.redirect('/'); 
        }
    });
  });

// Esta función ahora es asincrónica https://stackoverflow.com/questions/72336177/error-reqlogout-requires-a-callback-function
/* app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
}); */
// md5 es para el HASHING //
app.post("/register", (req, res) => {

    User.register({username:req.body.username}, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login", (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
     
    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
                console.log("autheticated user...")
            });
        }
    })

});


app.listen(3000, (req, res) => {
    console.log("Server has started at port 3000...")
})