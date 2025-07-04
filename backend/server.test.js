const request = require("supertest");
const app = require("./server");
const puppeteer = require("puppeteer");

describe("Web Scraper API", () => {
  jest.setTimeout(30000); // Puppeteer can be slow

  it("should reject invalid URL", async () => {
    const res = await request(app)
      .post("/api/scrape")
      .send({ url: "not-a-url" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("should scrape a valid static site", async () => {
    const res = await request(app)
      .post("/api/scrape")
      .send({ url: "https://example.com" });
    expect(res.statusCode).toBe(200);
    expect(res.body.companyName).toBeTruthy();
    expect(res.body.website).toBe("https://example.com");
    expect(Array.isArray(res.body.emails)).toBe(true);
    expect(Array.isArray(res.body.phones)).toBe(true);
    expect(res.body.dynamic).toBe(false);
  });

  it("should fallback to static scraping if Puppeteer fails", async () => {
    // Mock Puppeteer to throw, so fallback to Cheerio is tested
    const originalLaunch = puppeteer.launch;
    puppeteer.launch = jest.fn().mockImplementation(() => {
      throw new Error("Puppeteer failed");
    });
    const res = await request(app)
      .post("/api/scrape")
      .send({ url: "https://example.com", dynamic: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.dynamic).toBe(false);
    expect(res.body.error).toMatch(/dynamic scraping failed/i);
    puppeteer.launch = originalLaunch; // Restore
  });

  it("should handle unreachable URLs gracefully", async () => {
    const res = await request(app)
      .post("/api/scrape")
      .send({ url: "https://thisurldoesnotexist.tld" });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/failed to scrape|both failed/i);
  });
});
