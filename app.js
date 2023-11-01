//jshint esversion:6
require('dotenv').config();   
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
const { log } = require('console');
const md5 = require("md5");

const app = express();

console.log(md5("123456"));

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// Esto encripta en la base de datos. Ver archivo .env leer mongoose-encryption (documentación) //
// const secret = "Thisisourlittlesecret.";
// Al empezar a hacer el hashing lo has quitado.
//userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema)

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

// md5 es para el HASHING //
app.post("/register", (req, res) => {

    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser.save()
        .then(() => {
            res.render("secrets");
            console.log("You made it into the secrets!")
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username})
        .then((foundUser) => {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("secrets");
                }
            }
        })
        .catch((err) => {
            console.log(err);
        });
});



app.listen(3000, (req, res) =>{
    console.log("Server has started at port 3000...")
})