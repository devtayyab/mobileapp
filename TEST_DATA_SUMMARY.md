# Test Data Summary

This document outlines all the test data that has been seeded into the marketplace database for testing purposes.

## Categories (6 Total)

### Main Categories
1. **Clothing** - Fashion clothing and apparel
2. **Accessories** - Fashion accessories and jewelry
3. **Lifestyle** - Lifestyle and home products
4. **Footwear** - Shoes, sneakers, and footwear
5. **Electronics** - Tech gadgets and accessories
6. **Beauty** - Beauty and personal care products

## Products (40+ Total)

### Clothing (10 products)
| Product Name | SKU | B2C Price | B2B Price | Stock | Featured |
|--------------|-----|-----------|-----------|-------|----------|
| Classic Cotton T-Shirt | CLT-001 | $29.99 | $19.99 | 150 | ✓ |
| Denim Jeans | CLT-002 | $79.99 | $54.99 | 100 | ✓ |
| Casual Hoodie | CLT-003 | $49.99 | $34.99 | 80 | |
| Summer Dress | CLT-004 | $89.99 | $62.99 | 60 | ✓ |
| Leather Jacket | CLT-005 | $199.99 | $139.99 | 45 | ✓ |
| Wool Sweater | CLT-006 | $69.99 | $48.99 | 95 | |
| Chino Pants | CLT-007 | $59.99 | $41.99 | 120 | |
| Blazer | CLT-008 | $149.99 | $104.99 | 55 | ✓ |
| Polo Shirt | CLT-009 | $39.99 | $27.99 | 180 | |
| Track Pants | CLT-010 | $44.99 | $31.49 | 140 | |

### Accessories (8 products)
| Product Name | SKU | B2C Price | B2B Price | Stock | Featured |
|--------------|-----|-----------|-----------|-------|----------|
| Leather Wallet | ACC-001 | $39.99 | $27.99 | 200 | ✓ |
| Sunglasses | ACC-002 | $59.99 | $41.99 | 120 | |
| Leather Belt | ACC-003 | $34.99 | $24.49 | 150 | ✓ |
| Smartwatch | ACC-004 | $149.99 | $104.99 | 75 | ✓ |
| Backpack | ACC-005 | $79.99 | $55.99 | 110 | ✓ |
| Scarf | ACC-006 | $29.99 | $20.99 | 200 | |
| Baseball Cap | ACC-007 | $24.99 | $17.49 | 250 | |
| Crossbody Bag | ACC-008 | $89.99 | $62.99 | 85 | ✓ |

### Footwear (5 products)
| Product Name | SKU | B2C Price | B2B Price | Stock | Featured |
|--------------|-----|-----------|-----------|-------|----------|
| Running Shoes | FOT-001 | $119.99 | $83.99 | 100 | ✓ |
| Casual Sneakers | FOT-002 | $89.99 | $62.99 | 130 | ✓ |
| Leather Boots | FOT-003 | $159.99 | $111.99 | 65 | |
| Sandals | FOT-004 | $49.99 | $34.99 | 180 | |
| Formal Shoes | FOT-005 | $139.99 | $97.99 | 70 | |

### Electronics (5 products)
| Product Name | SKU | B2C Price | B2B Price | Stock | Featured |
|--------------|-----|-----------|-----------|-------|----------|
| Wireless Earbuds | ELC-001 | $99.99 | $69.99 | 150 | ✓ |
| Phone Case | ELC-002 | $19.99 | $13.99 | 300 | |
| Portable Charger | ELC-003 | $39.99 | $27.99 | 200 | ✓ |
| USB Cable | ELC-004 | $14.99 | $10.49 | 500 | |
| Bluetooth Speaker | ELC-005 | $79.99 | $55.99 | 120 | ✓ |

### Beauty (5 products)
| Product Name | SKU | B2C Price | B2B Price | Stock | Featured |
|--------------|-----|-----------|-----------|-------|----------|
| Face Moisturizer | BTY-001 | $34.99 | $24.49 | 220 | |
| Lip Balm Set | BTY-002 | $18.99 | $13.29 | 280 | |
| Hair Serum | BTY-003 | $29.99 | $20.99 | 190 | ✓ |
| Facial Mask Pack | BTY-004 | $24.99 | $17.49 | 240 | |
| Perfume | BTY-005 | $89.99 | $62.99 | 95 | ✓ |

### Lifestyle (8 products)
| Product Name | SKU | B2C Price | B2B Price | Stock | Featured |
|--------------|-----|-----------|-----------|-------|----------|
| Ceramic Mug | LIF-001 | $19.99 | $13.99 | 250 | |
| Scented Candle | LIF-002 | $24.99 | $17.49 | 180 | ✓ |
| Yoga Mat | LIF-003 | $44.99 | $31.49 | 90 | |
| Water Bottle | LIF-004 | $29.99 | $20.99 | 300 | |
| Notebook Set | LIF-005 | $22.99 | $16.09 | 350 | |
| Travel Pillow | LIF-006 | $34.99 | $24.49 | 160 | |
| Desk Organizer | LIF-007 | $39.99 | $27.99 | 140 | |
| Lunch Box | LIF-008 | $27.99 | $19.59 | 200 | |

## Product Images

Most products now have high-quality product images from Pexels stock photography:

### Products with Images
- Classic Cotton T-Shirt (2 images)
- Denim Jeans (2 images)
- Casual Hoodie
- Summer Dress
- Leather Wallet
- Sunglasses
- Leather Belt
- Running Shoes (2 images)
- Casual Sneakers
- Wireless Earbuds
- Backpack
- Smartwatch
- Scented Candle
- Yoga Mat
- Bluetooth Speaker
- Leather Jacket
- Perfume

## Supplier Information

### Demo Fashion Supplier
- **Business Name**: Demo Fashion Supplier
- **KYC Status**: Approved
- **Commission Rate**: 10%
- **Status**: Active
- **Total Products**: 40+

## Testing Features

### User Roles to Test
1. **Customer (B2C)** - Register with "Customer" role
   - See retail (B2C) pricing
   - Standard shopping experience

2. **Wholesale (B2B)** - Register with "Wholesale" role
   - See wholesale (B2B) pricing
   - Lower prices on all products
   - "Wholesale" badge displayed

3. **Supplier** - Register with "Supplier" role
   - Access to supplier dashboard (when implemented)
   - Product management
   - Order fulfillment

4. **Admin** - (Requires manual database update)
   - Full platform access
   - All management features

### Price Comparison Examples
| Product | Customer Price | Wholesale Price | Savings |
|---------|----------------|-----------------|---------|
| Leather Jacket | $199.99 | $139.99 | $60 (30%) |
| Denim Jeans | $79.99 | $54.99 | $25 (31%) |
| Smartwatch | $149.99 | $104.99 | $45 (30%) |
| Running Shoes | $119.99 | $83.99 | $36 (30%) |

### Testing Scenarios

#### 1. Browse Products
- Navigate to "Shop" tab to see all 40+ products in a grid
- Navigate to "Home" tab to see featured products
- Navigate to "Categories" to browse by category

#### 2. Price Display
- Create a regular customer account - see B2C prices
- Create a wholesale account - see B2B prices and "Wholesale" badge

#### 3. Stock Indicators
- Products with < 10 stock show "Only X left" warning
- Out of stock products show overlay

#### 4. Product Features
- Featured products show star badge
- All products display high-quality images
- Responsive grid layout in Shop view

#### 5. User Experience
- Welcome screen with branding
- Role selection during registration
- Profile shows user role badge
- Different color badges for different roles

## Database Statistics

- **Total Categories**: 6
- **Total Products**: 40+
- **Products with Images**: 17+
- **Featured Products**: 15+
- **Total Stock Units**: 6,500+
- **Price Range**: $14.99 - $199.99

## Notes for Testing

1. **Creating Test Accounts**:
   - Email: Use any valid email format (e.g., test@example.com)
   - Password: Minimum 6 characters
   - Role: Select Customer, Wholesale, or Supplier during registration

2. **Viewing Wholesale Prices**:
   - Must register with "Wholesale" account type
   - B2B prices are approximately 30% lower than retail

3. **Product Images**:
   - Images are loaded from Pexels (requires internet connection)
   - Fallback to placeholder if image fails to load

4. **Navigation**:
   - 6 tabs: Home, Shop, Categories, Cart, Orders, Profile
   - Shop tab shows all products in grid view
   - Home tab shows featured products only

## Future Test Data Needs

- Sample cart items (requires authenticated user)
- Sample orders (requires authenticated user)
- Sample KYC documents for suppliers
- Sample payment records
- Sample shipment tracking data
- Multiple suppliers for comparison
- Product reviews and ratings
- Wishlist items
