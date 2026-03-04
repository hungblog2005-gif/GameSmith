# GameSmith Database Index Documentation

Tài liệu chi tiết về tất cả các indexes được tạo trong MongoDB database để tối ưu hóa hiệu suất truy vấn.

---

## 📋 Tổng Quan Colections

| Collection | Số Indexes | Mô Tả |
|------------|------------|-------|
| assets | 10 | Sản phẩm/tài sản game |
| users | 5 | Người dùng hệ thống |
| categories | 3 | Danh mục sản phẩm |
| conversations | 3 | Cuộc hội thoại tin nhắn |
| messages | 4 | Tin nhắn |
| wishlists | 3 | Danh sách yêu thích |
| orders | 5 | Đơn hàng |
| payments | 6 | Thanh toán |
| profiles | 4 | Hồ sơ người dùng |
| reviews | 3 | Đánh giá sản phẩm |
| ratings | 5 | Xếp hạng sản phẩm |
| transactions | 4 | Giao dịch |
| user_collections | 4 | Bộ sưu tập người dùng |

**TỔNG CỘNG: 59 Indexes**

---

## 🗂️ Chi Tiết Indexes Theo Collection

### 1. **ASSETS** (Sản phẩm/Tài sản)

```javascript
// Indexes cơ bản
idx_assets_slug               { slug: 1 }
idx_assets_creator_status     { creator: 1, status: 1 }
idx_assets_category_status    { category: 1, status: 1 }
idx_assets_tags               { tags: 1 }
idx_assets_price              { price: 1 }
idx_assets_status_featured    { status: 1, featured: 1 }

// Indexes thống kê
idx_assets_downloads          { downloads_count: -1 }
idx_assets_ratings_avg        { ratings_average: -1 }
idx_assets_created            { createdAt: -1 }

// Text Search
idx_assets_text               { title: "text", description: "text", tags: "text" }
```

**Sử dụng cho:**
- Tìm kiếm sản phẩm theo slug
- Lọc theo creator và status
- Lọc theo category
- Sắp xếp theo lượt tải, đánh giá
- Tìm kiếm toàn văn

---

### 2. **USERS** (Người dùng)

```javascript
idx_users_username           { username: 1 } - UNIQUE
idx_users_email              { email: 1 } - UNIQUE
idx_users_role_verified      { role: 1, is_verified: 1 }
idx_users_created            { created_at: -1 }
idx_users_purchased_assets   { purchased_assets: 1 }
```

**Sử dụng cho:**
- Đăng nhập (email/username)
- Phân loại user theo role
- Lịch sử người dùng
- Tìm sản phẩm đã mua

---

### 3. **CATEGORIES** (Danh mục)

```javascript
idx_categories_slug          { slug: 1 } - UNIQUE
idx_categories_parent_order  { parentId: 1, order: 1 }
idx_categories_active_order  { isActive: 1, order: 1 }
```

**Sử dụng cho:**
- Tìm danh mục theo slug
- Hiển thị danh mục cha-con
- Lọc danh mục hoạt động

---

### 4. **CONVERSATIONS** (Cuộc hội thoại)

```javascript
idx_conversations_participants  { participants: 1 }
idx_conversations_last_message  { last_message: 1 }
idx_conversations_recent        { updatedAt: -1 }
```

**Sử dụng cho:**
- Tìm cuộc hội thoại theo participants
- Lấy tin nhắn mới nhất
- Danh sách cuộc hội thoại gần đây

---

### 5. **MESSAGES** (Tin nhắn)

```javascript
idx_messages_conversation  { conversation: 1 }
idx_messages_sender        { sender: 1 }
idx_messages_unread        { is_read: 1 }
idx_messages_date          { createdAt: -1 }
```

**Sử dụng cho:**
- Lấy tin nhắn theo cuộc hội thoại
- Tìm tin nhắn từ người gửi
- Lọc tin nhắn chưa đọc
- Sắp xếp theo ngày

---

### 6. **WISHLISTS** (Danh sách yêu thích)

```javascript
idx_wishlists_unique_user_asset  { user: 1, assets: 1 } - UNIQUE
idx_wishlists_user               { user: 1 }
idx_wishlists_asset              { assets: 1 }
```

**Sử dụng cho:**
- Kiểm tra sản phẩm trong wishlist
- Lấy wishlist của user
- Tìm wishlist chứa sản phẩm

---

### 7. **ORDERS** (Đơn hàng)

```javascript
idx_orders_number       { orderNumber: 1 } - UNIQUE
idx_orders_user_created { user: 1, createdAt: -1 }
idx_orders_status_payment { status: 1, paymentStatus: 1 }
idx_orders_asset_items  { items.asset: 1 }
idx_orders_created      { createdAt: -1 }
```

**Sử dụng cho:**
- Tìm đơn hàng theo số
- Lấy đơn hàng của user
- Lọc theo trạng thái
- Tìm đơn hàng chứa sản phẩm

---

### 8. **PAYMENTS** (Thanh toán)

```javascript
idx_payments_order              { order: 1 }
idx_payments_user_history       { user: 1, created_at: -1 }
idx_payments_transaction_unique { transaction_id: 1 } - UNIQUE
idx_payments_status             { status: 1 }
idx_payments_method_status      { method: 1, status: 1 }
idx_payments_ttl                { created_at: 1 } - TTL (90 ngày)
```

**Sử dụng cho:**
- Tìm thanh toán theo đơn hàng
- Lịch sử thanh toán của user
- Kiểm tra transaction_id duy nhất
- Lọc theo trạng thái thanh toán
- Tự động xóa thanh toán cũ (TTL)

---

### 9. **PROFILES** (Hồ sơ người dùng)

```javascript
idx_profiles_user           { userId: 1 } - UNIQUE
idx_profiles_text_search    { display_name: "text", bio: "text", skills: "text" }
idx_profiles_location       { country: 1, city: 1 }
idx_profiles_followers      { stats.followersCount: -1 }
```

**Sử dụng cho:**
- Lấy hồ sơ theo userId
- Tìm kiếm profie theo tên, bio, skills
- Lọc theo địa chỉ
- Sắp xếp theo followers

---

### 10. **REVIEWS** (Đánh giá)

```javascript
idx_reviews_unique_user_asset { user: 1, asset: 1 } - UNIQUE
idx_reviews_asset_rating      { asset: 1, rating: -1 }
idx_reviews_user_date         { user: 1, createdAt: -1 }
```

**Sử dụng cho:**
- Kiểm tra một user chỉ đánh giá một lần
- Lấy đánh giá của sản phẩm
- Lịch sử đánh giá của user

---

### 11. **RATINGS** (Xếp hạng)

```javascript
idx_ratings_unique_user_asset { user: 1, asset: 1 } - UNIQUE
idx_ratings_asset             { asset: 1 }
idx_ratings_user              { user: 1 }
idx_ratings_value             { value: 1 }
idx_ratings_helpful           { helpful_count: -1 }
```

**Sử dụng cho:**
- Kiểm tra rating duy nhất per user/asset
- Lấy ratings của sản phẩm
- Lấy ratings từ user
- Sắp xếp theo độ hữu ích

---

### 12. **TRANSACTIONS** (Giao dịch)

```javascript
idx_transactions_user_created   { user: 1, created_at: -1 }
idx_transactions_order          { order: 1 }
idx_transactions_status         { status: 1 }
idx_transactions_transaction_id { transaction_id: 1 } - UNIQUE
```

**Sử dụng cho:**
- Lịch sử giao dịch của user
- Tìm giao dịch theo đơn hàng
- Lọc theo trạng thái
- Kiểm tra transaction_id duy nhất

---

### 13. **USER_COLLECTIONS** (Bộ sưu tập người dùng)

```javascript
idx_collections_unique_user_asset { user: 1, asset: 1 } - UNIQUE
idx_collections_user_public       { user: 1, isPublic: 1 }
idx_collections_assets            { asset: 1 }
idx_collections_public_recent      { isPublic: 1, createdAt: -1 }
```

**Sử dụng cho:**
- Kiểm tra user đã thêm asset
- Lấy bộ sưu tập công khai/riêng tư
- Tìm bộ sưu tập chứa asset
- Danh sách bộ sưu tập công khai mới

---

## 🔑 Các Loại Index

### 1. **Single Field Indexes**
```javascript
{ field: 1 }        // Ascending
{ field: -1 }       // Descending
```

### 2. **Compound Indexes**
```javascript
{ field1: 1, field2: 1 }
{ field1: 1, field2: -1 }
```

### 3. **Unique Indexes**
```javascript
{ field: 1 } - { unique: true }
// Không cho phép giá trị trùng lặp
```

### 4. **Sparse Indexes**
```javascript
{ field: 1 } - { sparse: true }
// Chỉ index documents có field này
```

### 5. **Text Indexes**
```javascript
{ field1: "text", field2: "text" }
// Dùng cho tìm kiếm toàn văn
```

### 6. **TTL Indexes**
```javascript
{ createdAt: 1 } - { expireAfterSeconds: 7776000 }
// Tự động xóa documents sau khoảng thời gian
```

---

## 📊 Thống Kê Performance

### Index Coverage
- **Tổng fields được index:** 45+
- **Unique indexes:** 7
- **Compound indexes:** 12
- **Text search indexes:** 2
- **TTL indexes:** 1

### Loại Queries được tối ưu
- ✅ Equality queries (=)
- ✅ Range queries (>, <, >=, <=)
- ✅ Sort operations
- ✅ Text search
- ✅ Uniqueness constraints
- ✅ Auto-expiration (TTL)

---

## ⚠️ Lưu Ý Quan Trọng

### 1. **Index Storage**
- Mỗi index chiếm dung lượng bộ nhớ
- Theo dõi kích thước indexes thường xuyên
- Xóa indexes không sử dụng

### 2. **Write Performance**
- Indexes làm chậm write operations
- Cân bằng giữa read/write performance
- Tránh quá nhiều indexes trên một collection

### 3. **Query Planning**
- MongoDB chọn index tốt nhất tự động
- Sử dụng `.explain()` để kiểm tra query plan
- Đảm bảo indexes được sử dụng

### 4. **Maintenance**
```bash
# Rebuild tất cả indexes
db.collection.reIndex()

# Xóa một index cụ thể
db.collection.dropIndex("index_name")

# Xem tất cả indexes
db.collection.getIndexes()

# Xem index stats
db.collection.aggregate([{ $indexStats: {} }])
```

---

## 🔌 Tích Hợp Với Code

### Mongoose Schema Definition
```typescript
// Schema definition
const schema = new Schema({ field: String });

// Index definition
schema.index({ field: 1 }, { name: 'index_name' });

export const schemaModel = model('Collection', schema);
```

### Kiểm Tra Indexes Tại Runtime
```bash
# Connect to MongoDB
mongosh

# Select database
use gamesmith_db

# View all indexes
db.assets.getIndexes()

# View index stats
db.assets.aggregate([{ $indexStats: {} }])
```

---

## 📝 Checklist Maintenance

- [ ] Kiểm tra unused indexes hàng tuần
- [ ] Monitor index size
- [ ] Kiểm tra query performance
- [ ] Update documentation khi thêm index
- [ ] Backup database trước khi xóa indexes
- [ ] Test performance trước/sau khi thay đổi indexes

---

**Last Updated:** March 2, 2026  
**Database Version:** MongoDB 7.1.0  
**Mongoose Version:** 9.1.6
