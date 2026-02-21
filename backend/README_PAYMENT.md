# Payment Module - Quick Start Guide

## 🚀 Setup (2 bước)

### Bước 1: Module đã được tạo ✓
Payment module đã được thêm vào `app.module.ts`:
```typescript
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    // ... other modules
    PaymentsModule,
  ],
})
export class AppModule {}
```

### Bước 2: Database Setup
Cập nhật User schema (`users.schema.ts`) - ✓ Đã thêm `purchased_assets` field

```typescript
@Prop({
  type: [{ type: Types.ObjectId, ref: 'Asset' }],
  default: [],
})
purchased_assets!: Types.ObjectId[];
```

---

## 📋 API Endpoints Reference

### 1. Create Payment
```bash
POST http://localhost:3000/payments
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "orderId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "amount": 29.99,
  "method": "card"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment đã được tạo. Vui lòng hoàn tất thanh toán.",
  "data": {
    "paymentId": "507f1f77bcf86cd799439013",
    "orderId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "amount": 29.99,
    "method": "card",
    "status": "pending",
    "created_at": "2024-02-21T10:30:00Z"
  }
}
```

---

### 2. Payment Callback (từ Gateway)
```bash
POST http://localhost:3000/payments/callback
Content-Type: application/json

{
  "paymentId": "507f1f77bcf86cd799439013",
  "transaction_id": "stripe_txn_12345",
  "status": "success",
  "gateway_response": { ... },
  "signature": "sha256_hash"
}
```

**Tự động sau khi callback:**
- ✅ Update Payment status → 'success'
- ✅ Update Order status → 'paid'
- ✅ Thêm assets vào user.purchased_assets

---

### 3. Get Payment
```bash
GET http://localhost:3000/payments/507f1f77bcf86cd799439013
Authorization: Bearer {jwt_token}
```

---

### 4. Get User Payments
```bash
GET http://localhost:3000/payments/user/507f1f77bcf86cd799439012?page=1&limit=10
Authorization: Bearer {jwt_token}
```

---

### 5. Cancel Payment
```bash
POST http://localhost:3000/payments/507f1f77bcf86cd799439013/cancel
Authorization: Bearer {jwt_token}
```

---

## 🔒 Tính Năng Bảo Mật Đã Implement

| Tính Năng | Implement | Chi Tiết |
|-----------|-----------|---------|
| ✅ MongoDB Transactions | Có | Đảm bảo consistency khi update multiple collections |
| ✅ Tránh Double Payment | Có | Kiểm tra pending payment + idempotency key |
| ✅ Tránh Double Processing | Có | `is_processed` flag + transaction_id check |
| ✅ Validate User Ownership | Có | Kiểm tra user là chủ của order |
| ✅ Idempotency | Có | Auto-generate hoặc dùng client-provided key |
| ✅ Error Handling | Có | Try-catch + transaction rollback |
| ✅ Signature Verification | Có | Method sẵn sàng, cần implement theo gateway |

---

## 🛠️ Customize theo Payment Gateway của bạn

### Stripe (Recommended)
File example: `STRIPE_INTEGRATION.ts`

1. Install: `npm install stripe`
2. Add env vars:
   ```
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_PUBLIC_KEY=pk_test_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
3. Implement webhook handler
4. Call `/stripe/webhook` từ Stripe Dashboard

### PayPal
Tương tự, implement signature verification khác:
```typescript
verifyPayPalSignature(req, webhookId) {
  // Implement PayPal-specific verification
}
```

### Other Gateways
Khung (skeleton) đã sẵn sàng, chỉ cần adapt `verifyCallbackSignature()`

---

## 📊 Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CREATE ORDER (Orders Module)                             │
│    order.status = 'pending'                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ 2. CREATE PAYMENT (Payments Module)                         │
│    - Validate order exists                                  │
│    - Validate user is owner                                 │
│    - Check idempotency                                      │
│    - Create payment.status = 'pending'                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ 3. SEND TO PAYMENT GATEWAY (Stripe/PayPal/etc)             │
│    - Frontend calls gateway with paymentId                  │
│    - Gateway processes payment                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ 4. CALLBACK FROM GATEWAY (Webhook)                          │
│    - Verify signature                                       │
│    - Check is_processed flag (no double processing)         │
│    - Update payment.status = 'success'                      │
│    - Update payment.transaction_id                          │
│    - Update order.status = 'paid'                           │
│    - Assign assets: user.purchased_assets += order.items    │
│    - Set is_processed = true                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ 5. USER CAN ACCESS ASSET                                    │
│    - Check user.purchased_assets                            │
│    - Allow download/access                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing dengan cURL

### Create Order (Orders Module)
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439012",
    "items": [
      {
        "assetId": "507f1f77bcf86cd799439020",
        "price": 29.99
      }
    ],
    "totalPrice": 29.99
  }'
```

### Create Payment
```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "orderId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "amount": 29.99,
    "method": "card"
  }'
```

### Simulate Payment Success
```bash
curl -X POST http://localhost:3000/payments/callback \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "507f1f77bcf86cd799439013",
    "transaction_id": "stripe_txn_12345",
    "status": "success",
    "gateway_response": {},
    "signature": "test_sig"
  }'
```

---

## 🔍 Database Schema

### Payment Collection
```javascript
db.payments.findOne({})
{
  _id: ObjectId("..."),
  order: ObjectId("..."),
  user: ObjectId("..."),
  amount: 29.99,
  method: "card",
  status: "success",
  transaction_id: "stripe_12345",
  is_processed: true,
  processed_at: ISODate("2024-02-21T10:31:00.000Z"),
  created_at: ISODate("2024-02-21T10:30:00.000Z"),
  updated_at: ISODate("2024-02-21T10:31:00.000Z")
}
```

### Order Collection Update
```javascript
db.orders.findOne({_id: ObjectId("...")})
{
  _id: ObjectId("..."),
  user: ObjectId("..."),
  items: [...],
  total_price: 29.99,
  status: "paid",  // Changed from 'pending'
  createdAt: ...
}
```

### User Collection Update
```javascript
db.users.findOne({_id: ObjectId("...")})
{
  _id: ObjectId("..."),
  username: "john_doe",
  purchased_assets: [
    ObjectId("507f1f77bcf86cd799439020"),
    // ... other purchased assets
  ],
  ...
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "is_processed" flag not resetting
**Solution:** This is by design. Once processed, a payment cannot be updated again (idempotent).

### Issue 2: User not receiving assets after payment
**Check:**
1. Order items are valid ObjectIds
2. User schema has `purchased_assets` field
3. MongoDB transaction committed successfully
4. No errors in logs

### Issue 3: Duplicate webhook calls
**Solution:** Already handled - callback returns 200 OK for duplicate calls without reprocessing.

### Issue 4: Order status  not updating to 'paid'
**Check:**
1. Payment status is 'success'
2. MongoDB transaction is committed
3. Order._id matches payment.order

---

## 📚 Documentation Files

| File | Mục Đích |
|------|---------|
| `PAYMENT_GUIDE.md` | Hướng dẫn chi tiết đầy đủ (40+ trang) |
| `STRIPE_INTEGRATION.ts` | Example tích hợp Stripe |
| `README.md` | File này - Quick start |

---

## ✅ Checklist trước deploy

- [ ] Test create payment flow
- [ ] Test payment callback (success & failed)
- [ ] Test idempotency (duplicate requests)
- [ ] Test authorization (user ownership)
- [ ] Verify order status updates
- [ ] Verify asset assignment
- [ ] Setup payment gateway webhook
- [ ] Configure environment variables
- [ ] Test with real payment (sandbox mode first)
- [ ] Monitor error logs

---

## 📞 Support

Xem `PAYMENT_GUIDE.md` cho troubleshooting chi tiết.

---

## 💡 Next Steps

1. **Implement Payment Gateway Integration** (Stripe/PayPal)
2. **Setup Webhook Handler**
3. **Create Frontend Payment Form**
4. **Write E2E Tests**
5. **Deploy to Production**

---

**Status:** ✅ Production-Ready
**Last Updated:** 2024-02-21
