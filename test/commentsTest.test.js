const {
  initializeMongoServer,
  closeServer,
} = require("./test/mongoConfigTesting");
const { getMockExpressApp } = require("./test/expressTestSetup");
const posts = require("../routes/posts");

const request = require("supertest");

const app = getMockExpressApp(posts);

describe("comment route test", () => {
  let token = "";
  let userId = "";
  let postId = "";
  let commentId = "";

  beforeAll(async () => {
    console.log("starting server...");
    await initializeMongoServer();

    const signupResponse = await request(app).post("/auth/signup").send({
      username: "admin",
      password: "admin",
      password_confirm: "admin",
    });

    const response = await request(app).post("/auth/login").send({
      username: "admin",
      password: "admin",
    });

    const postResponse = await request(app)
      .post("/")
      .set("Authorization", `Bearer ${response.body.token}`)
      .send({
        title: "test post",
        content: "test content",
      });

    token = response.body.token;
    userId = signupResponse.body.user._id;
    postId = postResponse.body.post._id;
  });

  afterAll(() => {
    console.log("stopping server...");
    closeServer();
  });

  test("create comment", (done) => {
    request(app)
      .post(`/${postId}/comments`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        message: "test message",
      })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.comment.author._id).toBe(userId);
        expect(res.body.comment.post).toBe(postId);
        expect(res.body.comment.message).toBe("test message");
        commentId = res.body.comment._id;
        return done();
      });
  });

  test("get comments", (done) => {
    request(app)
      .get(`/${postId}/comments`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.comments.length).toBe(1);
        expect(res.body.comments[0].author._id).toBe(userId);
        expect(res.body.comments[0].post).toBe(postId);
        return done();
      });
  });
  test("get one comment", (done) => {
    request(app)
      .get(`/${postId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.comment.author._id).toBe(userId);
        expect(res.body.comment.post).toBe(postId);
        expect(res.body.comment.message).toBe("test message");
        return done();
      });
  });

  test("update comment", (done) => {
    request(app)
      .put(`/${postId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        message: "test message updated",
      })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.updatedComment.author._id).toBe(userId);
        expect(res.body.updatedComment.post).toBe(postId);
        expect(res.body.updatedComment.message).toBe("test message updated");
        return done();
      });
  });

  test("like comment", (done) => {
    request(app)
      .post(`/${postId}/comments/${commentId}/like/toggle`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.like_count).toBe(1);
        expect(res.body.isUserLiked).toBe(true);
        return done();
      });
  });

  test("dislike comment", (done) => {
    request(app)
      .post(`/${postId}/comments/${commentId}/like/toggle`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.like_count).toBe(0);
        expect(res.body.isUserLiked).toBe(false);
        return done();
      });
  });

  test("delete comment", (done) => {
    request(app)
      .delete(`/${postId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.deletedComment.author._id).toBe(userId);
        expect(res.body.deletedComment.post).toBe(postId);
        expect(res.body.deletedComment.message).toBe("test message updated");
        return done();
      });
  });
});
