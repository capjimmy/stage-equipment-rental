"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = exports.DeliveryMethod = exports.FulfillmentStatus = exports.PaymentStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const rental_entity_1 = require("./rental.entity");
const payment_entity_1 = require("./payment.entity");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["CONFIRMED"] = "confirmed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["EXPIRED"] = "expired";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var FulfillmentStatus;
(function (FulfillmentStatus) {
    FulfillmentStatus["REQUESTED"] = "requested";
    FulfillmentStatus["HOLD_PENDINGPAY"] = "hold_pendingpay";
    FulfillmentStatus["CONFIRMED"] = "confirmed";
    FulfillmentStatus["PREPARING"] = "preparing";
    FulfillmentStatus["DISPATCHED"] = "dispatched";
    FulfillmentStatus["DELIVERED"] = "delivered";
    FulfillmentStatus["RETURNED"] = "returned";
    FulfillmentStatus["INSPECTING"] = "inspecting";
    FulfillmentStatus["INSPECTION_PASSED"] = "inspection_passed";
    FulfillmentStatus["INSPECTION_FAILED"] = "inspection_failed";
    FulfillmentStatus["REJECTED"] = "rejected";
    FulfillmentStatus["CANCELED"] = "canceled";
    FulfillmentStatus["EXPIRED"] = "expired";
})(FulfillmentStatus || (exports.FulfillmentStatus = FulfillmentStatus = {}));
var DeliveryMethod;
(function (DeliveryMethod) {
    DeliveryMethod["QUICK"] = "quick";
    DeliveryMethod["PARCEL"] = "parcel";
    DeliveryMethod["BUNDLE"] = "bundle";
})(DeliveryMethod || (exports.DeliveryMethod = DeliveryMethod = {}));
let Order = class Order {
    id;
    userId;
    user;
    startDate;
    endDate;
    totalAmount;
    paymentMethod;
    paymentStatus;
    fulfillmentStatus;
    deliveryMethod;
    shippingCost;
    shippingAddress;
    returnAddress;
    deliveryNotes;
    depositDeadlineAt;
    adminApprovedAt1;
    adminApprovedAt2;
    canceledAt;
    canceledBy;
    cancellationReason;
    refundRate;
    refundAmount;
    cancellationFee;
    refundProcessedAt;
    rejectionReason;
    rentals;
    payments;
    createdAt;
    updatedAt;
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Order.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.orders),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Order.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Order.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Order.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'bank_transfer' }),
    __metadata("design:type", String)
], Order.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: PaymentStatus.PENDING,
    }),
    __metadata("design:type", String)
], Order.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: FulfillmentStatus.REQUESTED,
    }),
    __metadata("design:type", String)
], Order.prototype, "fulfillmentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        nullable: true,
    }),
    __metadata("design:type", String)
], Order.prototype, "deliveryMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "shippingCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "shippingAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "returnAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "deliveryNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "depositDeadlineAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "adminApprovedAt1", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "adminApprovedAt2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "canceledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "canceledBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "cancellationReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Order.prototype, "refundRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Order.prototype, "refundAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Order.prototype, "cancellationFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "refundProcessedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => rental_entity_1.Rental, (rental) => rental.order),
    __metadata("design:type", Array)
], Order.prototype, "rentals", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_entity_1.Payment, (payment) => payment.order),
    __metadata("design:type", Array)
], Order.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['paymentStatus']),
    (0, typeorm_1.Index)(['fulfillmentStatus']),
    (0, typeorm_1.Index)(['createdAt']),
    (0, typeorm_1.Index)(['startDate', 'endDate'])
], Order);
//# sourceMappingURL=order.entity.js.map