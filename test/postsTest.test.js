const {
  initializeMongoServer,
  closeServer,
} = require("./test/mongoConfigTesting");
const { getMockExpressApp } = require("./test/expressTestSetup");
const posts = require("../routes/posts");

const request = require("supertest");

const app = getMockExpressApp(posts);

describe("posts route test", () => {
  let token = "";
  let userId = "";
  let userB = "";
  let postId = "";

  beforeAll(async () => {
    console.log("starting server...");
    await initializeMongoServer();

    const userAResponse = await request(app).post("/auth/signup").send({
      username: "admin",
      password: "admin",
      password_confirm: "admin",
    });

    const userBResponse = await request(app).post("/auth/signup").send({
      username: "dummy2",
      password: "dummy2",
      password_confirm: "dummy2",
    });

    //login as user A
    const loginResponse = await request(app).post("/auth/login").send({
      username: "admin",
      password: "admin",
    });

    await request(app)
      .post(`/${userB}/follow-user`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`);

    token = loginResponse.body.token;
    userId = userAResponse.body.user._id;
    userB = userBResponse.body.user._id;
  });

  afterAll(() => {
    console.log("stopping server...");
    closeServer();
  });

  test("create post", (done) => {
    request(app)
      .post("/")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "test title",
        content: "test content",
      })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.post.title).toBe("test title");
        expect(res.body.post.content).toBe("test content");
        expect(res.body.post.author._id).toBe(userId);
        expect(res.body.post.images.length).toBe(0);
        expect(res.body.post.like_count).toBe(0);
        postId = res.body.post._id;
        return done();
      });
  });

  test("get posts", (done) => {
    request(app)
      .get("/")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.posts.length).toBe(1);
        return done();
      });
  });

  test("get my feeds", (done) => {
    request(app)
      .get("/my-feed")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.posts.length).toBe(1);
        return done();
      });
  });

  test("get one post", (done) => {
    request(app)
      .get(`/${postId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.post.title).toBe("test title");
        expect(res.body.post.content).toBe("test content");
        expect(res.body.post.author._id).toBe(userId);
        expect(res.body.post.images.length).toBe(0);
        expect(res.body.post.like_count).toBe(0);
        return done();
      });
  });

  test("update post", (done) => {
    request(app)
      .put(`/${postId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "test title updated",
        content: "test content updated",
        like_count: 5,
      })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.updatedPost.title).toBe("test title updated");
        expect(res.body.updatedPost.content).toBe("test content updated");
        expect(res.body.updatedPost.author._id).toBe(userId);
        expect(res.body.updatedPost.images.length).toBe(0);
        expect(res.body.updatedPost.like_count).toBe(5);
        return done();
      });
  });

  test("delete post", (done) => {
    request(app)
      .delete(`/${postId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.deletedPost.title).toBe("test title updated");
        expect(res.body.deletedPost.content).toBe("test content updated");
        expect(res.body.deletedPost.author._id).toBe(userId);
        expect(res.body.deletedPost.images.length).toBe(0);
        expect(res.body.deletedPost.like_count).toBe(5);
        return done();
      });
  });
});
