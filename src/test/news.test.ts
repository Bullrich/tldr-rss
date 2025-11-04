import Parser from "rss-parser";

import { fetchNews, getRSSFeed } from "../news";

describe("fetchNews", () => {
  it("should return empty array when URL returns 404", async () => {
    // Test with a URL that should return 404
    const result = await fetchNews("https://httpstat.us/404");
    expect(result).toEqual([]);
  });

  it("should return empty array when URL is invalid", async () => {
    // Test with an invalid URL
    const result = await fetchNews(
      "https://invalid-url-that-does-not-exist.invalid",
    );
    expect(result).toEqual([]);
  });
});

describe("getRSSFeed", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("should handle successful RSS feed parsing", async () => {
    // Mock parser to simulate successful parsing
    const mockParser = {
      parseURL: jest.fn().mockResolvedValue({ items: [{ title: "Test" }] }),
    };
    jest
      .spyOn(Parser.prototype, "parseURL")
      .mockImplementation(mockParser.parseURL);

    const result = await getRSSFeed("https://example.com/rss");

    expect(result).toEqual({ items: [{ title: "Test" }] });
    expect(mockParser.parseURL).toHaveBeenCalledWith("https://example.com/rss");

    jest.restoreAllMocks();
  });

  it("should retry on 429 errors up to 7 times total", async () => {
    const error429 = new Error("Too Many Requests") as Error & {
      response: { status: number; headers: Record<string, string> };
    };
    error429.response = {
      status: 429,
      headers: { "retry-after": "1" },
    };

    const mockParser = jest
      .spyOn(Parser.prototype, "parseURL")
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({ items: [{ title: "Success after retries" }] });

    const result = await getRSSFeed("https://example.com/rss");

    expect(result).toEqual({ items: [{ title: "Success after retries" }] });
    expect(mockParser).toHaveBeenCalledTimes(7);

    jest.restoreAllMocks();
  }, 10000); // 10 second timeout for this test

  it("should fail after 7 attempts for 429 errors", async () => {
    const error429 = new Error("Too Many Requests") as Error & {
      response: { status: number; headers: Record<string, string> };
    };
    error429.response = {
      status: 429,
      headers: { "retry-after": "1" },
    };

    const mockParser = jest
      .spyOn(Parser.prototype, "parseURL")
      .mockRejectedValue(error429);

    await expect(getRSSFeed("https://example.com/rss")).rejects.toThrow(
      "Too Many Requests",
    );
    expect(mockParser).toHaveBeenCalledTimes(7);

    jest.restoreAllMocks();
  }, 10000); // 10 second timeout for this test

  it("should succeed after failing 4 times and succeeding on 5th attempt", async () => {
    const error429 = new Error("Too Many Requests") as Error & {
      response: { status: number; headers: Record<string, string> };
    };
    error429.response = {
      status: 429,
      headers: { "retry-after": "1" },
    };

    const mockParser = jest
      .spyOn(Parser.prototype, "parseURL")
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({ items: [{ title: "Success on 5th try" }] });

    const result = await getRSSFeed("https://example.com/rss");

    expect(result).toEqual({ items: [{ title: "Success on 5th try" }] });
    expect(mockParser).toHaveBeenCalledTimes(5);

    jest.restoreAllMocks();
  }, 10000); // 10 second timeout for this test

  it("should not retry on non-429 errors", async () => {
    const error404 = new Error("Not Found") as Error & {
      response: { status: number };
    };
    error404.response = { status: 404 };

    const mockParser = jest
      .spyOn(Parser.prototype, "parseURL")
      .mockRejectedValue(error404);

    await expect(getRSSFeed("https://example.com/rss")).rejects.toThrow(
      "Not Found",
    );
    expect(mockParser).toHaveBeenCalledTimes(1);

    jest.restoreAllMocks();
  });

  it("should use default 30 second delay when retry-after header is missing", async () => {
    const error429 = new Error("Too Many Requests") as Error & {
      response: { status: number; headers: Record<string, string> };
    };
    error429.response = {
      status: 429,
      headers: {},
    };

    // Mock Date.now and setTimeout to test delay
    const setTimeoutSpy = jest
      .spyOn(global, "setTimeout")
      .mockImplementation((callback, delay) => {
        expect(delay).toBe(30000); // Should be 30 seconds
        // Call callback immediately for test
        (callback as () => void)();
        const mockTimeout: NodeJS.Timeout = {
          ref: () => mockTimeout,
          unref: () => mockTimeout,
          hasRef: () => true,
          refresh: () => mockTimeout,
          [Symbol.toPrimitive]: () => 0,
          [Symbol.dispose]: () => {},
        };
        return mockTimeout;
      });

    const _mockParser = jest
      .spyOn(Parser.prototype, "parseURL")
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({ items: [{ title: "Success" }] });

    const result = await getRSSFeed("https://example.com/rss");

    expect(result).toEqual({ items: [{ title: "Success" }] });
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 30000);

    setTimeoutSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("should retry on 429 errors with message only (no response object)", async () => {
    // This simulates how rss-parser throws errors: just Error("Status code 429")
    const error429 = new Error("Status code 429");

    // Mock setTimeout to avoid waiting
    const setTimeoutSpy = jest
      .spyOn(global, "setTimeout")
      .mockImplementation((callback) => {
        // Call callback immediately for test
        (callback as () => void)();
        const mockTimeout: NodeJS.Timeout = {
          ref: () => mockTimeout,
          unref: () => mockTimeout,
          hasRef: () => true,
          refresh: () => mockTimeout,
          [Symbol.toPrimitive]: () => 0,
          [Symbol.dispose]: () => {},
        };
        return mockTimeout;
      });

    const mockParser = jest
      .spyOn(Parser.prototype, "parseURL")
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({ items: [{ title: "Success after retries" }] });

    const result = await getRSSFeed("https://example.com/rss");

    expect(result).toEqual({ items: [{ title: "Success after retries" }] });
    expect(mockParser).toHaveBeenCalledTimes(3);

    setTimeoutSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("should fail after 7 attempts for 429 errors with message only", async () => {
    // This simulates how rss-parser throws errors: just Error("Status code 429")
    const error429 = new Error("Status code 429");

    // Mock setTimeout to avoid waiting
    const setTimeoutSpy = jest
      .spyOn(global, "setTimeout")
      .mockImplementation((callback) => {
        // Call callback immediately for test
        (callback as () => void)();
        const mockTimeout: NodeJS.Timeout = {
          ref: () => mockTimeout,
          unref: () => mockTimeout,
          hasRef: () => true,
          refresh: () => mockTimeout,
          [Symbol.toPrimitive]: () => 0,
          [Symbol.dispose]: () => {},
        };
        return mockTimeout;
      });

    const mockParser = jest
      .spyOn(Parser.prototype, "parseURL")
      .mockRejectedValue(error429);

    await expect(getRSSFeed("https://example.com/rss")).rejects.toThrow(
      "Status code 429",
    );
    expect(mockParser).toHaveBeenCalledTimes(7);

    setTimeoutSpy.mockRestore();
    jest.restoreAllMocks();
  });
});
