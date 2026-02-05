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
exports.Rental = exports.RentalStatus = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./order.entity");
const asset_entity_1 = require("./asset.entity");
const rental_issue_entity_1 = require("./rental-issue.entity");
var RentalStatus;
(function (RentalStatus) {
    RentalStatus["REQUESTED"] = "requested";
    RentalStatus["HOLD_PENDINGPAY"] = "hold_pendingpay";
    RentalStatus["CONFIRMED"] = "confirmed";
    RentalStatus["RENTED"] = "rented";
    RentalStatus["RETURNED"] = "returned";
    RentalStatus["INSPECTED"] = "inspected";
    RentalStatus["COMPLETED"] = "completed";
    RentalStatus["CANCELED"] = "canceled";
    RentalStatus["REJECTED"] = "rejected";
    RentalStatus["EXPIRED"] = "expired";
})(RentalStatus || (exports.RentalStatus = RentalStatus = {}));
let Rental = class Rental {
    id;
    orderId;
    order;
    assetId;
    asset;
    startDate;
    endDate;
    bufferDays;
    blockedStart;
    blockedEnd;
    status;
    quantity;
    rentalRate;
    cancelReason;
    issues;
    createdAt;
    updatedAt;
};
exports.Rental = Rental;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Rental.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Rental.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, (order) => order.rentals),
    (0, typeorm_1.JoinColumn)({ name: 'orderId' }),
    __metadata("design:type", order_entity_1.Order)
], Rental.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Rental.prototype, "assetId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => asset_entity_1.Asset, (asset) => asset.rentals),
    (0, typeorm_1.JoinColumn)({ name: 'assetId' }),
    __metadata("design:type", asset_entity_1.Asset)
], Rental.prototype, "asset", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Rental.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Rental.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Rental.prototype, "bufferDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Rental.prototype, "blockedStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Rental.prototype, "blockedEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: RentalStatus.REQUESTED,
    }),
    __metadata("design:type", String)
], Rental.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Rental.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Rental.prototype, "rentalRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Rental.prototype, "cancelReason", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => rental_issue_entity_1.RentalIssue, (issue) => issue.rental),
    __metadata("design:type", Array)
], Rental.prototype, "issues", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Rental.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Rental.prototype, "updatedAt", void 0);
exports.Rental = Rental = __decorate([
    (0, typeorm_1.Entity)('rentals')
], Rental);
//# sourceMappingURL=rental.entity.js.map