// < --------------------------------------- >
//   DEPENDENCIES
// < --------------------------------------- >

require("dotenv").config();
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const app = express();

// < --------------------------------------- >
//   MIDDLEWARE
// < --------------------------------------- >

app.use(cors({ origin: true }));

// < --------------------------------------- >
//   INITIALIZERS
// < --------------------------------------- >

const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID,
};

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

// < --------------------------------------- >
//   UTILITIES
// < --------------------------------------- >

const testEmpty = (str) => {
    str.trim() === "" ? true : false;
};

// const testEmail = (email) => {
//     const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//     email.match(emailRegEx) ? true : false;
// };

// < --------------------------------------- >
//   ROUTING
// < --------------------------------------- >

// <- GET ALL users ->
app.get("/users", async (req, res) => {
    const snapshot = await db.collection("users").get();
    let users = [];
    snapshot.forEach((doc) => {
        let id = doc.id;
        let data = doc.data();
        users.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(users));
});

// <- CREATE NEW user ->
app.post("/users", async (req, res) => {
    const user = req.body;
    await db.collection("users").add(user);
    res.status(201).send();
});

// <- SHOW ONE user ->
app.get("/users/:id", async (req, res) => {
    const snapshot = await db.collection("users").doc(req.params.id).get();
    const userId = snapshot.id;
    const userData = snapshot.data();

    res.status(200).send(JSON.stringify({ id: userId, ...userData }));
});

// <- UPDATE user ->
app.put("/users/:id", async (req, res) => {
    const body = req.body;
    await db.collection("users").doc(req.params.id).update(body);
    res.status(200).send();
});

// <- DELETE user ->
app.delete("/users/:id", async (req, res) => {
    await db.collection("users").doc(req.params.id).delete();
    res.status(200).send();
});

// SIGNUP

app.post("/signup", (req, res) => {
    // prep new user payload from form
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        userName: req.body.userName,
    };
    let userToken, userId;
    let inputErrors = {};

    // test each field
    if (testEmpty(newUser.email)) {
        inputErrors.email = "Email field is required";
    }
    // else if (!testEmail(newUser.email)) {
    //     inputErrors.email = "Email is not a valid address";
    // }
    if (testEmpty(newUser.password)) {
        inputErrors.password = "Password is required";
    }
    if (newUser.password !== newUser.confirmPassword) {
        inputErrors.password = "Passwords do not match";
    }
    if (testEmpty(newUser.userName)) {
        inputErrors.userName = "Username is required";
    }

    // short circuit the rest of the operation if our
    // errors object has accumulated any errors
    Object.keys(inputErrors).length > 0 && res.status(400).json(inputErrors);
    // check if username is available
    db.doc(`/users/${newUser.userName}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return res
                    .status(400)
                    .json({ userName: "this user name is already taken" });
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(
                        newUser.email,
                        newUser.password
                    );
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((token) => {
            userToken = token;
            // create new user doc after validation
            const userCred = {
                userName: newUser.userName,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId: userId,
            };
            return db.doc(`/users/${newUser.userName}`).set(userCred);
        })
        .then((data) => {
            return res.status(201).json({ userToken });
        })
        .catch((error) => {
            if (error.code === "auth/email-already-in-use") {
                return res
                    .status(400)
                    .json({ email: "this email is already registered" });
            } else {
                return res.status(500).json({ error: error.code });
            }
        });
});

// POSTS

// <- GET ALL posts ->
app.get("/posts", async (req, res) => {
    const snapshot = await db.collection("posts").get();
    let posts = [];
    snapshot.forEach((doc) => {
        let id = doc.id;
        let data = doc.data();
        posts.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(posts));
});

app.post("/posts", (req, res) => {
    const newPost = {
        postBody: req.body.postBody,
        userName: req.body.userName,
    };
    return db.collection("posts").add(newPost).then(res.status(200).send());
});

// < --------------------------------------- >
//   EXPORTS
// < --------------------------------------- >

exports.api = functions.https.onRequest(app);
