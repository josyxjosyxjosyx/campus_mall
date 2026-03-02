export interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: string | null;
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  logo: string;
  rating: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  vendorId: string;
  vendorName: string;
  stockQuantity: number;
  rating: number;
  createdAt: string;
}

export const categories: Category[] = [
  { id: "1", name: "Electronics", slug: "electronics", parent: null },
  { id: "2", name: "Clothing", slug: "clothing", parent: null },
  { id: "3", name: "Accessories", slug: "accessories", parent: null },
  { id: "4", name: "Home & Living", slug: "home-living", parent: null },
  { id: "5", name: "Beauty", slug: "beauty", parent: null },
];

export const vendors: Vendor[] = [
  { id: "v1", name: "TechZone", description: "Premium electronics", logo: "🔌", rating: 4.8 },
  { id: "v2", name: "StyleHaus", description: "Trendy fashion", logo: "👗", rating: 4.6 },
  { id: "v3", name: "GlowUp", description: "Beauty essentials", logo: "✨", rating: 4.9 },
  { id: "v4", name: "HomeNest", description: "Home décor & more", logo: "🏠", rating: 4.7 },
];

export const products: Product[] = [
  {
    id: "p1", name: "Wireless Bluetooth Headphones", description: "Premium noise-cancelling headphones with 40-hour battery life and crystal-clear sound quality.",
    price: 89.99, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "Electronics", vendorId: "v1", vendorName: "TechZone", stockQuantity: 45, rating: 4.7, createdAt: "2025-01-15",
  },
  {
    id: "p2", name: "Smart Watch Pro", description: "Advanced fitness tracking with heart rate monitoring, GPS, and a gorgeous AMOLED display.",
    price: 249.99, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    category: "Electronics", vendorId: "v1", vendorName: "TechZone", stockQuantity: 20, rating: 4.5, createdAt: "2025-02-01",
  },
  {
    id: "p3", name: "Linen Summer Dress", description: "Breathable linen dress perfect for warm weather. Available in multiple colors.",
    price: 64.00, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop",
    category: "Clothing", vendorId: "v2", vendorName: "StyleHaus", stockQuantity: 30, rating: 4.8, createdAt: "2025-01-20",
  },
  {
    id: "p4", name: "Handcrafted Leather Bag", description: "Genuine Italian leather bag with adjustable strap and multiple compartments.",
    price: 129.00, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    category: "Accessories", vendorId: "v2", vendorName: "StyleHaus", stockQuantity: 15, rating: 4.9, createdAt: "2025-01-25",
  },
  {
    id: "p5", name: "Natural Face Serum", description: "Vitamin C enriched serum for radiant skin. Made with organic ingredients.",
    price: 34.99, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
    category: "Beauty", vendorId: "v3", vendorName: "GlowUp", stockQuantity: 60, rating: 4.6, createdAt: "2025-02-05",
  },
  {
    id: "p6", name: "Ceramic Vase Set", description: "Minimalist ceramic vases. Set of 3 in earthy tones.",
    price: 49.99, image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&h=400&fit=crop",
    category: "Home & Living", vendorId: "v4", vendorName: "HomeNest", stockQuantity: 25, rating: 4.4, createdAt: "2025-01-30",
  },
  {
    id: "p7", name: "Portable Bluetooth Speaker", description: "Waterproof speaker with 360° surround sound and 12-hour playtime.",
    price: 59.99, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
    category: "Electronics", vendorId: "v1", vendorName: "TechZone", stockQuantity: 35, rating: 4.3, createdAt: "2025-02-10",
  },
  {
    id: "p8", name: "Organic Lip Balm Collection", description: "Set of 4 organic lip balms in fruity flavors. Cruelty-free and vegan.",
    price: 18.99, image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop",
    category: "Beauty", vendorId: "v3", vendorName: "GlowUp", stockQuantity: 80, rating: 4.7, createdAt: "2025-02-12",
  },
];
