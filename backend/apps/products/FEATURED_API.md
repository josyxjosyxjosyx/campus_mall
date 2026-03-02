Featured Products API

Endpoint: GET /api/products/featured/

Description:
- Returns products marked as featured (`is_featured=True`) that are currently available (stock_quantity > 0 and `is_active=True`).

Response:
- 200 OK with JSON array of product objects (same format as `ProductSerializer`).

Notes:
- Use this endpoint to populate the frontend Featured Products section.
- The frontend currently requests `/api/products/featured/` and limits display to the first 4 items.