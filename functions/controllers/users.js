const { admin, db, firebase } = require("../helpers/initializers");
const { testEmpty } = require("../util/utils");

exports.signUp = (req, res) => {
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
    if (Object.keys(inputErrors).length > 0) {
        return res.status(400).json(inputErrors);
    }
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
                createdAt: new Date(),
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
};

exports.logIn = (req, res) => {
    const returningUser = {
        email: req.body.email,
        password: req.body.password,
    };
    let inputErrors = {};
    if (testEmpty(returningUser.email))
        inputErrors.email = "Please give an email address";
    if (testEmpty(returningUser.password))
        inputErrors.password = "Please enter your password";
    Object.keys(inputErrors).length > 0 && res.status(400).json(inputErrors);

    firebase
        .auth()
        .signInWithEmailAndPassword(returningUser.email, returningUser.password)
        .then((data) => {
            return data.user.getIdToken();
        })
        .then((userToken) => {
            return res.json({ userToken });
        })
        .catch((error) => {
            if (error.code === "auth/wrong-password") {
                return res.status(403).json({ message: "Incorrect password" });
            }
            return res.status(500).json({ error: error.code });
        });
};

exports.getUsers = async (req, res) => {
    const snapshot = await db.collection("users").get();
    let users = [];
    snapshot.forEach((doc) => {
        let id = doc.id;
        let data = doc.data();
        users.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(users));
};

exports.getOneUser = async (req, res) => {
    const snapshot = await db.collection("users").doc(req.params.id).get();
    const userId = snapshot.id;
    const userData = snapshot.data();

    res.status(200).send(JSON.stringify({ id: userId, ...userData }));
};

exports.createUser = async (req, res) => {
    const user = req.body;
    await db.collection("users").add(user);
    res.status(201).send();
};

exports.updateUser = async (req, res) => {
    const body = req.body;
    await db.collection("users").doc(req.params.id).update(body);
    res.status(200).send();
};

exports.deleteUser = async (req, res) => {
    await db.collection("users").doc(req.params.id).delete();
    res.status(200).send();
};
