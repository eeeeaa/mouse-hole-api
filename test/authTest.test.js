const {
  initializeMongoServer,
  closeServer,
} = require("./test/mongoConfigTesting");
const { getMockExpressApp } = require("./test/expressTestSetup");

const request = require("supertest");

const app = getMockExpressApp();

describe("auth route test", () => {
  beforeAll(async () => {
    console.log("starting server...");
    await initializeMongoServer();
  });

  afterAll(async () => {
    console.log("stopping server...");
    await closeServer();
  });

  test("signup test", (done) => {
    request(app)
      .post("/auth/signup")
      .send({
        username: "admin",
        password: "admin",
        password_confirm: "admin",
      })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        return done();
      });
  });

  test("login test", (done) => {
    request(app)
      .post("/auth/login")
      .send({
        username: "admin",
        password: "admin",
      })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        return done();
      });
  });
});
