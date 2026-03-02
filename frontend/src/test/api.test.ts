import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/services/api";

describe("ApiService route contracts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({}),
        text: async () => "",
      })
    );
    localStorage.clear();
  });

  it("uses trailing slash for product detail endpoint", async () => {
    await api.getProduct("123");

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/products/123/",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("uses update_status action endpoint for order status updates", async () => {
    await api.updateOrderStatus("ord_1", "SHIPPED");

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/orders/ord_1/update_status/",
      expect.objectContaining({ method: "PUT" })
    );
  });
});
