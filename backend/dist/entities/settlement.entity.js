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
exports.Settlement = exports.SettlementStatus = exports.SettlementType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const order_entity_1 = require("./order.entity");
const rental_entity_1 = require("./rental.entity");
var SettlementType;
(function (SettlementType) {
    SettlementType["RENTAL"] = "rental";
    SettlementType["ISSUE"] = "issue";
})(SettlementType || (exports.SettlementType = SettlementType = {}));
var SettlementStatus;
(function (SettlementStatus) {
    SettlementStatus["PENDING"] = "pending";
    SettlementStatus["CONFIRMED"] = "confirmed";
    SettlementStatus["PAID"] = "paid";
})(SettlementStatus || (exports.SettlementStatus = SettlementStatus = {}));
let Settlement = class Settlement {
    id;
    supplierId;
    supplier;
    orderId;
    order;
    rentalId;
    rental;
    type;
    grossAmount;
    platformFeeAmount;
    supplierAmount;
    status;
    settlementDate;
    createdAt;
    updatedAt;
};
exports.Settlement = Settlement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Settlement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Settlement.prototype, "supplierId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'supplierId' }),
    __metadata("design:type", user_entity_1.User)
], Settlement.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Settlement.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'orderId' }),
    __metadata("design:type", order_entity_1.Order)
], Settlement.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Settlement.prototype, "rentalId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rental_entity_1.Rental, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'rentalId' }),
    __metadata("design:type", rental_entity_1.Rental)
], Settlement.prototype, "rental", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: SettlementType.RENTAL,
    }),
    __metadata("design:type", String)
], Settlement.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Settlement.prototype, "grossAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Settlement.prototype, "platformFeeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Settlement.prototype, "supplierAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: SettlementStatus.PENDING,
    }),
    __metadata("design:type", String)
], Settlement.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Settlement.prototype, "settlementDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Settlement.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Settlement.prototype, "updatedAt", void 0);
exports.Settlement = Settlement = __decorate([
    (0, typeorm_1.Entity)('settlements')
], Settlement);
//# sourceMappingURL=settlement.entity.js.map