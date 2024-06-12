const { getMockExpressApp } = require("./test/expressTestSetup");
const index = require("../routes/index");
const request = require("supertest");

const app = getMockExpressApp(index);

describe("index route test", () => {
  test("index route check", (done) => {
    request(app).get("/").expect(200, done);
  });
});
