const { admin, db, firebase } = require("../helpers/initializers");

exports.getPosts = async (req, res) => {
    const snapshot = await db.collection("posts").get();
    let posts = [];
    snapshot.forEach((doc) => {
        let id = doc.id;
        let data = doc.data();
        posts.push({ id, ...data });
    });
    res.status(200).send(JSON.stringify(posts));
};

exports.createPost = (req, res) => {
    const newPost = {
        postBody: req.body.postBody,
        userName: req.user.userName,
        createdAt: new Date(),
    };
    return db
        .collection("posts")
        .add(newPost)
        .then(
            res
                .status(200)
                .json({ message: `new post submitted by ${newPost.userName}` })
        );
};
