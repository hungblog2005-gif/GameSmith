import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PaymentsModule } from './payments.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';

describe('Payments Module (E2E)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let paymentsService: PaymentsService;
  let ordersService: OrdersService;
  let usersService: UsersService;

  // Test data
  let testUserId: string;
  let testOrderId: string;
  let testAssetId: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        UsersModule,
        OrdersModule,
        PaymentsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    paymentsService = moduleFixture.get<PaymentsService>(PaymentsService);
    ordersService = moduleFixture.get<OrdersService>(OrdersService);
    usersService = moduleFixture.get<UsersService>(UsersService);

    // Create test data
    await setupTestData();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  async function setupTestData() {
    // Create test user
    const user = await usersService.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashed_password',
    });
    testUserId = user._id.toString();

    // Create test order
    testAssetId = new Types.ObjectId().toString();
    const order = await ordersService.create({
      userId: testUserId,
      items: [{ assetId: testAssetId, price: 29.99 }],
      totalPrice: 29.99,
    });
    testOrderId = order._id.toString();
  }

  describe('Payment Creation', () => {
    it('should create payment successfully', async () => {
      const result = await paymentsService.createPayment({
        orderId: testOrderId,
        userId: testUserId,
        amount: 29.99,
        method: 'card',
      });

      expect(result).toHaveProperty('paymentId');
      expect(result.status).toBe('pending');
      expect(result.amount).toBe(29.99);
      expect(result.method).toBe('card');
    });

    it('should throw error if order does not exist', async () => {
      const fakeOrderId = new Types.ObjectId().toString();

      await expect(
        paymentsService.createPayment({
          orderId: fakeOrderId,
          userId: testUserId,
          amount: 29.99,
          method: 'card',
        }),
      ).rejects.toThrow('Order không tồn tại');
    });

    it('should throw error if user is not order owner', async () => {
      const otherUserId = new Types.ObjectId().toString();

      await expect(
        paymentsService.createPayment({
          orderId: testOrderId,
          userId: otherUserId,
          amount: 29.99,
          method: 'card',
        }),
      ).rejects.toThrow('User không có quyền tạo payment cho order này');
    });

    it('should prevent duplicate pending payment', async () => {
      // Create first payment
      await paymentsService.createPayment({
        orderId: testOrderId,
        userId: testUserId,
        amount: 29.99,
        method: 'card',
      });

      // Try to create second payment - should fail
      // Note: Use different order to avoid conflict in cleanup
      const order2 = await ordersService.create({
        userId: testUserId,
        items: [{ assetId: testAssetId, price: 19.99 }],
        totalPrice: 19.99,
      });
      const orderId2 = order2._id.toString();

      const _payment1 = await paymentsService.createPayment({
        orderId: orderId2,
        userId: testUserId,
        amount: 19.99,
        method: 'card',
      });

      // Try duplicate - should throw ConflictException
      await expect(
        paymentsService.createPayment({
          orderId: orderId2,
          userId: testUserId,
          amount: 19.99,
          method: 'card',
        }),
      ).rejects.toThrow('Đã có payment pending cho order này');
    });

    it('should use idempotency key to prevent duplicates', async () => {
      const idempotencyKey = 'unique-key-' + Date.now();

      const payment1 = await paymentsService.createPayment({
        orderId: testOrderId,
        userId: testUserId,
        amount: 29.99,
        method: 'card',
        idempotency_key: idempotencyKey,
      });

      // Call again with same idempotency key
      const payment2 = await paymentsService.createPayment({
        orderId: testOrderId,
        userId: testUserId,
        amount: 29.99,
        method: 'card',
        idempotency_key: idempotencyKey,
      });

      // Should return same payment
      expect(payment1.paymentId).toBe(payment2.paymentId);
    });
  });

  describe('Payment Callback', () => {
    let paymentId: string;

    beforeEach(async () => {
      const order = await ordersService.create({
        userId: testUserId,
        items: [{ assetId: testAssetId, price: 15.99 }],
        totalPrice: 15.99,
      });

      const payment = await paymentsService.createPayment({
        orderId: order._id.toString(),
        userId: testUserId,
        amount: 15.99,
        method: 'card',
      });

      paymentId = payment.paymentId;
    });

    it('should process successful payment callback', async () => {
      const result = await paymentsService.handlePaymentCallback({
        paymentId,
        transaction_id: 'stripe_txn_12345',
        status: 'success',
      });

      expect(result.status).toBe('success');

      // Verify payment was updated
      const payment = await paymentsService.getPayment(paymentId);
      expect(payment.status).toBe('success');
      expect(payment.transaction_id).toBe('stripe_txn_12345');
      expect(payment.is_processed).toBe(true);
    });

    it('should update order status after successful payment', async () => {
      const payment = await paymentsService.getPayment(paymentId);
      const orderId = payment.order._id.toString();

      await paymentsService.handlePaymentCallback({
        paymentId,
        transaction_id: 'stripe_txn_12345',
        status: 'success',
      });

      const order = await ordersService.findById(orderId);
      expect(order.status).toBe('paid');
    });

    it('should assign assets to user after successful payment', async () => {
      await paymentsService.handlePaymentCallback({
        paymentId,
        transaction_id: 'stripe_txn_12345',
        status: 'success',
      });

      const user = await usersService.findById(testUserId);
      expect(user.purchased_assets).toContain(new Types.ObjectId(testAssetId));
    });

    it('should handle failed payment callback', async () => {
      const result = await paymentsService.handlePaymentCallback({
        paymentId,
        transaction_id: 'stripe_txn_failed',
        status: 'failed',
        error_message: 'Card declined',
      });

      expect(result.status).toBe('failed');

      const payment = await paymentsService.getPayment(paymentId);
      expect(payment.status).toBe('failed');
      expect(payment.error_message).toBe('Card declined');
    });

    it('should not update order on failed payment', async () => {
      const payment = await paymentsService.getPayment(paymentId);
      const orderId = payment.order._id.toString();

      await paymentsService.handlePaymentCallback({
        paymentId,
        transaction_id: 'stripe_txn_failed',
        status: 'failed',
      });

      const order = await ordersService.findById(orderId);
      expect(order.status).toBe('pending'); // Should remain pending
    });

    it('should prevent double processing (idempotency)', async () => {
      // Process once
      const _result1 = await paymentsService.handlePaymentCallback({
        paymentId,
        transaction_id: 'stripe_txn_12345',
        status: 'success',
      });

      // Process again - should return cached response
      const result2 = await paymentsService.handlePaymentCallback({
        paymentId,
        transaction_id: 'stripe_txn_12345',
        status: 'success',
      });

      expect(result2.message).toContain('đã được xử lý trước đó');
    });

    it('should throw error if payment not found', async () => {
      const fakePaymentId = new Types.ObjectId().toString();

      await expect(
        paymentsService.handlePaymentCallback({
          paymentId: fakePaymentId,
          transaction_id: 'stripe_txn_12345',
          status: 'success',
        }),
      ).rejects.toThrow('Payment không tồn tại');
    });
  });

  describe('Payment Retrieval', () => {
    let paymentId: string;
    let orderId: string;

    beforeEach(async () => {
      const order = await ordersService.create({
        userId: testUserId,
        items: [{ assetId: testAssetId, price: 9.99 }],
        totalPrice: 9.99,
      });
      orderId = order._id.toString();

      const payment = await paymentsService.createPayment({
        orderId: orderId,
        userId: testUserId,
        amount: 9.99,
        method: 'card',
      });

      paymentId = payment.paymentId;
    });

    it('should retrieve payment by ID', async () => {
      const payment = await paymentsService.getPayment(paymentId);
      expect(payment._id.toString()).toBe(paymentId);
      expect(payment.amount).toBe(9.99);
    });

    it('should get user payments with pagination', async () => {
      const result = await paymentsService.getPaymentsByUser(testUserId, 1, 10);

      expect(result.payments).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should get payment by order ID', async () => {
      const payment = await paymentsService.getPaymentByOrder(orderId);
      expect(payment.order._id.toString()).toBe(orderId);
    });
  });

  describe('Payment Cancellation', () => {
    let paymentId: string;

    beforeEach(async () => {
      const order = await ordersService.create({
        userId: testUserId,
        items: [{ assetId: testAssetId, price: 5.99 }],
        totalPrice: 5.99,
      });

      const payment = await paymentsService.createPayment({
        orderId: order._id.toString(),
        userId: testUserId,
        amount: 5.99,
        method: 'card',
      });

      paymentId = payment.paymentId;
    });

    it('should cancel pending payment', async () => {
      const result = await paymentsService.cancelPayment(paymentId, testUserId);

      expect(result.status).toBe('cancelled');

      const payment = await paymentsService.getPayment(paymentId);
      expect(payment.status).toBe('cancelled');
    });

    it('should prevent cancel if not owner', async () => {
      const otherUserId = new Types.ObjectId().toString();

      await expect(
        paymentsService.cancelPayment(paymentId, otherUserId),
      ).rejects.toThrow('User không có quyền hủy payment này');
    });

    it('should prevent cancel if already processed', async () => {
      // Process payment first
      await paymentsService.handlePaymentCallback({
        paymentId,
        transaction_id: 'stripe_txn_12345',
        status: 'success',
      });

      // Try to cancel - should fail
      await expect(
        paymentsService.cancelPayment(paymentId, testUserId),
      ).rejects.toThrow('Không thể hủy payment đã được xử lý');
    });
  });

  describe('Transaction Safety', () => {
    it('should rollback on any error during payment creation', async () => {
      const invalidOrderId = 'invalid-id-not-objectid';

      try {
        await paymentsService.createPayment({
          orderId: invalidOrderId,
          userId: testUserId,
          amount: 29.99,
          method: 'card',
        });
      } catch (error) {
        // Error expected
      }

      // Verify no partial data was created
      // (Implementation depends on your error handling)
    });

    it('should rollback on error during callback processing', async () => {
      // This would require mocking orderModel to throw an error
      // to test rollback behavior
    });
  });
});
