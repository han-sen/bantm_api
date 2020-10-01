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

exports.getOnePost = (req, res) => {
    let postData = {};
    db.doc(`/posts/${req.params.postId}`)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return res
                    .status(404)
                    .json({ error: "We couldn't find that post" });
            }
            postData = doc.data();
            postData.postId = doc.id;
            return db
                .collection("comments")
                .where("postId", "=", req.params.postId)
                .get();
        })
        .then((data) => {
            postData.comments = [];
            data.forEach((doc) => {
                postData.comments.push(doc.data());
            });
            return res.json(postData);
        })
        .catch((error) => {
            return res.status(500).json({ error: error.code });
        });
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
