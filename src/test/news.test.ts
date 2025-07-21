import { fetchNews } from "../news";

describe("fetchNews", () => {
  it("should return empty array when URL returns 404", async () => {
    // Test with a URL that should return 404
    const result = await fetchNews("https://httpstat.us/404");
    expect(result).toEqual([]);
  });

  it("should return empty array when URL is invalid", async () => {
    // Test with an invalid URL
    const result = await fetchNews("https://invalid-url-that-does-not-exist.invalid");
    expect(result).toEqual([]);
  });
});