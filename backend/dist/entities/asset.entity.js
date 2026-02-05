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
exports.Asset = exports.AssetStatus = exports.AssetConditionGrade = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
const rental_entity_1 = require("./rental.entity");
var AssetConditionGrade;
(function (AssetConditionGrade) {
    AssetConditionGrade["A"] = "A";
    AssetConditionGrade["B"] = "B";
    AssetConditionGrade["C"] = "C";
})(AssetConditionGrade || (exports.AssetConditionGrade = AssetConditionGrade = {}));
var AssetStatus;
(function (AssetStatus) {
    AssetStatus["AVAILABLE"] = "available";
    AssetStatus["RENTED"] = "rented";
    AssetStatus["MAINTENANCE"] = "maintenance";
    AssetStatus["INACTIVE"] = "inactive";
    AssetStatus["LOST"] = "lost";
})(AssetStatus || (exports.AssetStatus = AssetStatus = {}));
let Asset = class Asset {
    id;
    productId;
    product;
    assetCode;
    conditionGrade;
    status;
    notes;
    photos;
    rentals;
    createdAt;
    updatedAt;
};
exports.Asset = Asset;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Asset.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Asset.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, (product) => product.assets),
    (0, typeorm_1.JoinColumn)({ name: 'productId' }),
    __metadata("design:type", product_entity_1.Product)
], Asset.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Asset.prototype, "assetCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: AssetConditionGrade.A,
    }),
    __metadata("design:type", String)
], Asset.prototype, "conditionGrade", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: AssetStatus.AVAILABLE,
    }),
    __metadata("design:type", String)
], Asset.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Asset.prototype, "photos", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => rental_entity_1.Rental, (rental) => rental.asset),
    __metadata("design:type", Array)
], Asset.prototype, "rentals", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Asset.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Asset.prototype, "updatedAt", void 0);
exports.Asset = Asset = __decorate([
    (0, typeorm_1.Entity)('assets')
], Asset);
//# sourceMappingURL=asset.entity.js.map