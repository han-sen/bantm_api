// < --------------------------------------- >
//   DEPENDENCIES
// < --------------------------------------- >

const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const app = express();

// < --------------------------------------- >
//   MIDDLEWARE
// < --------------------------------------- >

app.use(cors({ origin: true }));

// < --------------------------------------- >
//   ROUTING
// < --------------------------------------- >

const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

app.get("/", async (req, res) => {
    const snapshot = await db.collection("users").get();
    let users = [];
    snapshot.forEach((doc) => {
        let id = doc.id;
        let data = doc.data();
        users.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(users));
});

app.post("/", async (req, res) => {
    const user = req.body;
    await db.collection("users").add(user);
    res.status(201).send();
});

exports.user = functions.https.onRequest(app);
