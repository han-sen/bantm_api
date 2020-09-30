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
//   EXPORTS
// < --------------------------------------- >

module.exports = { admin, db, firebase };
