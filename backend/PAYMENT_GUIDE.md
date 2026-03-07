# Payment Module - Hướng Dẫn Toàn Diện

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Architecture](#architecture)
3. [Flow Thanh Toán](#flow-thanh-toán)
4. [API Documentation](#api-documentation)
5. [Tính Năng Bảo Mật](#tính-năng-bảo-mật)
6. [Integration với Payment Gateway](#integration-với-payment-gateway)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Tổng Quan

Payment module cung cấp giải pháp thanh toán hoàn chỉnh cho hệ thống bán asset với các tính năng:

✅ **Quản lý Payment State** - Tracking payment từ pending → success/failed  
✅ **MongoDB Transactions** - Đảm bảo consistency dữ liệu  
✅ **Tránh Double Payment** - Idempotency key + is_processed flag  
✅ **Validate Ownership** - Kiểm tra user là chủ order  
✅ **Asset Assignment** - Tự động cấp quyền asset sau thanh toán thành công  
✅ **Error Recovery** - Xử lý lỗi gracefully với session rollback  

---

## Architecture

### Database Schema

#### Payment Collection
```typescript
{
  _id: ObjectId,
  order: ObjectId,           // Reference to Order
  user: ObjectId,            // Reference to User
  amount: Number,            // Số tiền
  method: String,            // 'card', 'paypal', 'wallet', 'bank_transfer'
  status: String,            // 'pending', 'success', 'failed', 'cancelled'
  transaction_id: String,    // ID từ payment gateway
  gateway_response: Object,  // Response từ gateway
  error_message: String,     // Error message nếu thất bại
  is_processed: Boolean,     // Flag để tránh double processing
  processed_at: Date,        // Thời gian xử lý callback
  idempotency_key: String,   // Unique key để tránh duplicate request
  created_at: Date,
  updated_at: Date
}
```

#### Order Collection Updates
```typescript
{
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  // Khi payment success → order.status = 'paid'
}
```

#### User Collection Updates
```typescript
{
  purchased_assets: [ObjectId, ...]  // Array of Asset IDs user đã mua
}
```

---

## Flow Thanh Toán

### 1️⃣ Tạo Order (Orders Module)
```
User                           Orders Service
  |                                  |
  |-- POST /orders             ----→ |
  |                                  |
  |                          Create order
  |                          status = 'pending'
  |                                  |
  |← -- Created Order ---- --------- |
```

### 2️⃣ Tạo Payment (Payments Module)
```
User                           Payments Service            Database
  |                                  |                         |
  |-- POST /payments          ----→ |                          |
  |       {orderId, userId,          |                          |
  |        amount, method}           |                          |
  |                            Validate Order -----→ |
  |                            Validate User Owner   |
  |                            Check Idempotency  ←  |
  |                            Create Payment   ----→ |
  |                                  |                          |
  |← -- paymentId ----------- ------- |← --------- --|
```

**Validation Steps:**
- ✓ Order tồn tại
- ✓ User là chủ của order
- ✓ Order status = 'pending'
- ✓ Không có payment pending khác
- ✓ Idempotency key (nếu có) không trùng

### 3️⃣ Gửi Thanh Toán tới Gateway
```
Frontend                      Payment Gateway
  |                                |
  |-- paymentId + amount   ----→  |
  |                          Process Payment
  |                                |
  |← --- txnId/success ------- --- |
```

### 4️⃣ Callback từ Gateway (Webhook)
```
Payment Gateway               Payments Service            Database
  |                                 |                        |
  |-- POST /payments/callback ----→ |                        |
  |   {paymentId, txnId,           |                        |
  |    status, signature}          |                        |
  |                            Verify Signature            |
  |                            Check is_processed  -----→  |
  |                            Update Payment      -----→  |
  |                                 |                     |
  |                            If Success:        -----→  |
  |                            - Update Order             |
  |                            - Assign Assets   -----→  |
  |                                 |                        |
  |← --- 200 OK ------------- ------ |← ----- --------- --|
```

**Processing Steps:**
- ✓ Verify gateway signature
- ✓ Check `is_processed` flag (tránh double processing)
- ✓ Update payment status & transaction_id
- ✓ Nếu success: update order & assign assets
- ✓ Set `is_processed = true` & `processed_at = now`

---

## API Documentation

### 1. Create Payment
```http
POST /payments
Content-Type: application/json
Authorization: Bearer {token}

{
  "orderId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "amount": 29.99,
  "method": "card",
  "idempotency_key": "unique-key-123"  // Optional, auto-generated if not provided
}
```

**Response (201 Created):**
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

**Error Cases:**
```json
{
  "success": false,
  "message": "Order không tồn tại: 507f1f77bcf86cd799439011"
}

{
  "success": false,
  "message": "User không có quyền tạo payment cho order này"
}

{
  "success": false,
  "message": "Đã có payment pending cho order này. Payment ID: 507f1f77bcf86cd799439013"
}
```

---

### 2. Payment Callback (Webhook)
```http
POST /payments/callback
Content-Type: application/json

{
  "paymentId": "507f1f77bcf86cd799439013",
  "transaction_id": "stripe_txn_12345",
  "status": "success",
  "gateway_response": {
    "id": "stripe_txn_12345",
    "object": "charge",
    "amount": 2999,
    "amount_captured": 2999
  },
  "signature": "sha256_hash_signature",
  "error_message": null
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Payment callback đã được xử lý thành công",
    "paymentId": "507f1f77bcf86cd799439013",
    "status": "success",
    "orderStatus": "paid"
  }
}
```

**Response (Idempotent - 200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Payment đã được xử lý trước đó",
    "paymentId": "507f1f77bcf86cd799439013",
    "status": "success"
  }
}
```

---

### 3. Get Payment Details
```http
GET /payments/507f1f77bcf86cd799439013
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "order": {
      "_id": "507f1f77bcf86cd799439011",
      "total_price": 29.99,
      "status": "paid",
      "items": [...]
    },
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "email": "user@example.com",
      "username": "john_doe"
    },
    "amount": 29.99,
    "method": "card",
    "status": "success",
    "transaction_id": "stripe_txn_12345",
    "is_processed": true,
    "processed_at": "2024-02-21T10:31:00Z",
    "created_at": "2024-02-21T10:30:00Z"
  }
}
```

---

### 4. Get User Payments
```http
GET /payments/user/507f1f77bcf86cd799439012?page=1&limit=10
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [...],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

---

### 5. Get Payment by Order
```http
GET /payments/order/507f1f77bcf86cd799439011
Authorization: Bearer {token}
```

---

### 6. Cancel Payment
```http
POST /payments/507f1f77bcf86cd799439013/cancel
Authorization: Bearer {token}
```

**Conditions:**
- ✓ User phải là chủ payment
- ✓ Status phải là 'pending'
- ✓ Chưa được processed (`is_processed = false`)

---

## Tính Năng Bảo Mật

### 1. Tránh Double Payment
```typescript
// Mechanism 1: Idempotency Key
const existingPayment = await this.paymentModel.findOne({
  idempotency_key: dto.idempotency_key
});
if (existingPayment) {
  return existingPayment; // Return existing instead of creating new
}

// Mechanism 2: Check pending payment
const existingPayment = await this.paymentModel.findOne({
  order: orderId,
  status: 'pending',
  is_processed: false
});
// Throw ConflictException if exists
```

### 2. Tránh Double Processing
```typescript
// Flag: is_processed
if (payment.is_processed) {
  return { message: 'Payment đã được xử lý trước đó' }; // Idempotent response
}

// Add transaction_id check
if (payment.transaction_id !== null) {
  throw new ConflictException('Payment đã có transaction_id');
}

// Set flag after processing
payment.is_processed = true;
payment.processed_at = new Date();
```

### 3. Validate User Ownership
```typescript
// Check user là chủ của order
if (order.user.toString() !== userId) {
  throw new BadRequestException(
    'User không có quyền tạo payment cho order này'
  );
}

// Check user là chủ của payment
if (payment.user.toString() !== userId) {
  throw new BadRequestException('User không có quyền hủy payment này');
}
```

### 4. MongoDB Transactions
```typescript
const session = await this.paymentModel.startSession();
session.startTransaction();

try {
  // Multiple writes within transaction
  await paymentModel.save({ session });
  await orderModel.findByIdAndUpdate({...}, { session });
  await userModel.findByIdAndUpdate({...}, { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction(); // Rollback on any error
  throw error;
} finally {
  await session.endSession();
}
```

### 5. Signature Verification
```typescript
// Verify callback từ payment gateway
const isValid = this.paymentsService.verifyCallbackSignature(
  JSON.stringify(payload),
  signature,
  process.env.PAYMENT_GATEWAY_SECRET
);

if (!isValid) {
  throw new BadRequestException('Invalid signature');
}
```

---

## Integration với Payment Gateway

### Stripe Integration (Example)

#### 1. Setup Environment Variables
```bash
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### 2. Create Payment Intent (Frontend)
```javascript
// Frontend - sau khi tạo payment
const paymentId = response.data.paymentId;
const amount = response.data.amount;

const { clientSecret } = await fetch('/stripe/create-intent', {
  method: 'POST',
  body: JSON.stringify({ paymentId, amount })
}).then(r => r.json());

// Use Stripe.js to confirm payment
const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'John Doe' }
  }
});
```

#### 3. Webhook Handler (Backend)
```typescript
@Post('webhook/stripe')
async handleStripeWebhook(@Req() req: RawBodyRequest<Request>) {
  const signature = req.headers['stripe-signature'] as string;
  const rawBody = req.rawBody;

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'charge.succeeded') {
      const charge = event.data.object;
      
      // Find payment by metadata.paymentId
      const paymentId = charge.metadata.paymentId;
      
      await this.paymentsService.handlePaymentCallback({
        paymentId,
        transaction_id: charge.id,
        status: 'success',
        gateway_response: charge,
        signature: signature // Pass signature for verification
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
}
```

### PayPal Integration (Example)

```typescript
// Similar approach, but verify PayPal signature differently
const isValid = this.paymentsService.verifyPayPalSignature(
  req,
  process.env.PAYPAL_WEBHOOK_ID
);
```

---

## Error Handling

### Common Errors

#### 1. Order Not Found
```
Status: 404
Message: Order không tồn tại: 507f1f77bcf86cd799439011
Action: Create order first before creating payment
```

#### 2. User Not Owner
```
Status: 400
Message: User không có quyền tạo payment cho order này
Action: Verify payment.userId === order.user
```

#### 3. Order Not in Pending Status
```
Status: 400
Message: Order không ở trạng thái pending. Trạng thái hiện tại: paid
Action: Can only create payment for pending orders
```

#### 4. Payment Already Exists
```
Status: 409
Message: Đã có payment pending cho order này. Payment ID: 507f1f77bcf86cd799439013
Action: Either cancel existing or wait for it to complete
```

#### 5. Double Payment (Idempotency)
```
Status: 200 (Cached Response)
Message: Payment đã được tạo trước đó
Action: Return existing payment instead of creating new
```

#### 6. Double Processing
```
Status: 200 (Idempotent)
Message: Payment đã được xử lý trước đó
Action: Accept duplicate webhook calls gracefully
```

---

## Testing

### Unit Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { getModelToken } from '@nestjs/mongoose';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getModelToken('Payment'),
          useValue: {
            startSession: jest.fn(),
            findById: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          }
        },
        // ... other models
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should create payment', async () => {
    const result = await service.createPayment({
      orderId: 'order123',
      userId: 'user123',
      amount: 29.99,
      method: 'card',
    });

    expect(result).toHaveProperty('paymentId');
    expect(result.status).toBe('pending');
  });

  it('should prevent duplicate payment', async () => {
    // First payment succeeds
    // Second payment should throw ConflictException
  });

  it('should handle callback idempotently', async () => {
    // Call callback twice with same data
    // Both should return success without double processing
  });
});
```

### Integration Test Example

```typescript
describe('Payment Integration', () => {
  it('should complete full payment flow', async () => {
    // 1. Create order
    const order = await ordersService.create({...});
    
    // 2. Create payment
    const payment = await paymentsService.createPayment({
      orderId: order._id,
      userId: order.user,
      amount: order.total_price,
      method: 'card'
    });
    
    // 3. Simulate gateway callback
    await paymentsService.handlePaymentCallback({
      paymentId: payment.paymentId,
      transaction_id: 'txn_123',
      status: 'success'
    });
    
    // 4. Verify:
    // - Payment.status = 'success'
    // - Order.status = 'paid'
    // - User.purchased_assets contains order items
  });
});
```

---

## Troubleshooting

### Q1: Payment callback not working?
```
A: 
1. Check signature verification implementation
2. Verify webhook secret is correct
3. Check payment gateway logs
4. Ensure callback URL is accessible from internet
5. Check if is_processed flag prevents re-processing
```

### Q2: Double payment issue?
```
A:
1. Verify idempotency_key is being used
2. Check for concurrent requests (add database-level unique index)
3. Verify is_processed flag logic
4. Add request deduplication at API gateway level
```

### Q3: Transaction timeout?
```
A:
1. Increase MongoDB transaction timeout:
   await session.startTransaction({
     readConcern: 'snapshot',
     writeConcern: { w: 'majority' },
     maxCommitTimeMS: 10000
   });
2. Optimize queries within transaction
3. Consider splitting large transactions
```

### Q4: Memory leaks with sessions?
```
A:
1. Always call await session.endSession() in finally block
2. Abort transaction on error: await session.abortTransaction()
3. Monitor open sessions
```

### Q5: Asset assignment not happening?
```
A:
1. Verify User schema has purchased_assets field
2. Check asset references are valid ObjectIds
3. Verify $addToSet operation in transaction
4. Check User model is properly injected in PaymentsService
```

---

## Performance Optimization

### 1. Database Indices
```typescript
// Already created in Payment schema
PaymentSchema.index({ order: 1, status: 1 });
PaymentSchema.index({ user: 1, created_at: -1 });
PaymentSchema.index({ idempotency_key: 1 }, { sparse: true });
```

### 2. Query Optimization
```typescript
// Use projection to limit fields
const payment = await this.paymentModel
  .findOne({ order: orderId })
  .select('_id status amount order user');

// Use populate judiciously
const payment = await this.paymentModel
  .findById(id)
  .populate({
    path: 'order',
    select: 'total_price status' // Only needed fields
  })
  .lean() // Return plain objects, not Mongoose documents
  .exec();
```

### 3. Caching
```typescript
// Cache payment status checks (TTL: 30 seconds)
@Cacheable({
  key: 'payment_{{paymentId}}',
  ttl: 30
})
async getPayment(paymentId: string) {
  return this.paymentModel.findById(paymentId);
}
```

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Payment gateway webhook verified
- [ ] Signature verification implemented
- [ ] Database indices created
- [ ] Error logging configured
- [ ] Rate limiting added to API
- [ ] HTTPS configured
- [ ] CORS properly set
- [ ] Payment timeout handling
- [ ] Monitoring & alerting setup
- [ ] Backup procedure for payments
- [ ] Testing in sandbox environment first

---

## Related Modules

- **Orders Module** - Create orders before payments
- **Users Module** - User validation & asset assignment
- **Assets Module** - Asset reference & download after payment
- **Transactions Module** - Legacy transaction history

---

## Files Structure

```
src/modules/payments/
├── schemas/
│   └── payment.schema.ts        # Payment data model
├── dto/
│   ├── create-payment.dto.ts    # Validation for payment creation
│   └── payment-callback.dto.ts  # Validation for gateway callback
├── payments.service.ts          # Business logic
├── payments.controller.ts       # API endpoints
├── payments.module.ts           # Module definition
└── payments.spec.ts             # Unit tests (optional)
```

---

## Support & Contributions

For issues, questions, or contributions, please contact the development team.

Last Updated: 2024-02-21
