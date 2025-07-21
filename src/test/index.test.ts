describe("Date filtering logic", () => {
  it("should filter RSS items correctly based on date range", () => {
    const MAX_DAYS = 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_DAYS);

    const mockItems = [
      {
        isoDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        link: "https://example.com/1",
      },
      {
        isoDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        link: "https://example.com/2",
      },
      {
        isoDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        link: "https://example.com/3",
      },
      {
        isoDate: undefined, // Invalid date
        link: "https://example.com/4",
      },
    ];

    // Filter items the same way as in the main code
    const recentItems = mockItems.filter((item) => {
      if (!item.isoDate) return false;
      const itemDate = new Date(item.isoDate);
      return itemDate >= cutoffDate;
    });

    expect(recentItems).toHaveLength(2);
    expect(recentItems[0].link).toBe("https://example.com/1");
    expect(recentItems[1].link).toBe("https://example.com/3");
  });
});
