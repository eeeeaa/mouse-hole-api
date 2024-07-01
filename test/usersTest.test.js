const {
  initializeMongoServer,
  closeServer,
} = require("./test/mongoConfigTesting");
const { getMockExpressApp } = require("./test/expressTestSetup");
const users = require("../routes/users");

const request = require("supertest");

const app = getMockExpressApp(users);

describe("users route test", () => {
  let token = "";
  let userId = "";
  let toBeDelete = "";

  beforeAll(async () => {
    console.log("starting server...");
    await initializeMongoServer();

    const signupResponse = await request(app).post("/auth/signup").send({
      username: "admin",
      password: "admin",
      password_confirm: "admin",
    });

    const dummy = await request(app).post("/auth/signup").send({
      username: "dummy2",
      password: "dummy2",
      password_confirm: "dummy2",
    });

    const response = await request(app).post("/auth/login").send({
      username: "admin",
      password: "admin",
    });

    token = response.body.token;
    userId = signupResponse.body.user._id;
    toBeDelete = dummy.body.user._id;
  });

  afterAll(() => {
    console.log("stopping server...");
    closeServer();
  });

  test("my profile test", (done) => {
    request(app)
      .get("/my-profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.user.username).toBe("admin");
        return done();
      });
  });

  test("get users test", (done) => {
    request(app)
      .get("/")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.users.length).toBe(2);
        expect(res.body.totalPages).toBe(1);
        expect(res.body.currentPage).toBe(0);
        return done();
      });
  });

  test("get one user test", (done) => {
    request(app)
      .get(`/${userId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.user.username).toBe("admin");
        return done();
      });
  });

  test("delete one user test", (done) => {
    request(app)
      .delete(`/${toBeDelete}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.deletedUser.username).toBe("dummy2");
        return done();
      });
  });
});

describe("user relationship test", () => {
  let token = "";
  let userA = "";
  let userB = "";

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

    token = loginResponse.body.token;
    userA = userAResponse.body.user._id;
    userB = userBResponse.body.user._id;
  });

  afterAll(() => {
    console.log("stopping server...");
    closeServer();
  });

  test("follow user", (done) => {
    request(app)
      .post(`/${userB}/follow-user`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.user_relationship.user_id_first).toBe(userA);
        expect(res.body.user_relationship.user_id_second).toBe(userB);
        return done();
      });
  });
  test("my followers test", (done) => {
    request(app)
      .get("/my-followers")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.users.length).toBe(0);
        expect(res.body.totalPages).toBe(0);
        expect(res.body.currentPage).toBe(0);
        return done();
      });
  });

  test("my followings test", (done) => {
    request(app)
      .get("/my-followings")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.users.length).toBe(1);
        expect(res.body.totalPages).toBe(1);
        expect(res.body.currentPage).toBe(0);
        return done();
      });
  });

  test("my follow status", (done) => {
    request(app)
      .get(`/${userB}/my-follow-status`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.user_relationship.user_id_first).toBe(userA);
        expect(res.body.user_relationship.user_id_second).toBe(userB);
        return done();
      });
  });

  test("user followers", (done) => {
    request(app)
      .get(`/${userB}/followers`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.users.length).toBe(1);
        expect(res.body.totalPages).toBe(1);
        expect(res.body.currentPage).toBe(0);
        return done();
      });
  });

  test("user followings", (done) => {
    request(app)
      .get(`/${userB}/followings`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.users.length).toBe(0);
        expect(res.body.totalPages).toBe(0);
        expect(res.body.currentPage).toBe(0);
        return done();
      });
  });

  test("unfollow user", (done) => {
    request(app)
      .delete(`/${userB}/unfollow-user`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.user_relationship.user_id_first).toBe(userA);
        expect(res.body.user_relationship.user_id_second).toBe(userB);
        return done();
      });
  });
});
