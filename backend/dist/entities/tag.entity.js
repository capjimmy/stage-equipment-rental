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
exports.Tag = exports.TagType = exports.TagStatus = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
var TagStatus;
(function (TagStatus) {
    TagStatus["APPROVED"] = "approved";
    TagStatus["PENDING"] = "pending";
    TagStatus["BLOCKED"] = "blocked";
})(TagStatus || (exports.TagStatus = TagStatus = {}));
var TagType;
(function (TagType) {
    TagType["COUNTRY"] = "country";
    TagType["ERA"] = "era";
    TagType["MOOD"] = "mood";
    TagType["PROP"] = "prop";
    TagType["GENRE"] = "genre";
    TagType["OTHER"] = "other";
})(TagType || (exports.TagType = TagType = {}));
let Tag = class Tag {
    id;
    name;
    type;
    synonyms;
    status;
    createdBy;
    products;
    createdAt;
    updatedAt;
};
exports.Tag = Tag;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Tag.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Tag.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: TagType.OTHER,
        nullable: true,
    }),
    __metadata("design:type", String)
], Tag.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Tag.prototype, "synonyms", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: TagStatus.PENDING,
    }),
    __metadata("design:type", String)
], Tag.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Tag.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => product_entity_1.Product, (product) => product.tags),
    __metadata("design:type", Array)
], Tag.prototype, "products", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Tag.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Tag.prototype, "updatedAt", void 0);
exports.Tag = Tag = __decorate([
    (0, typeorm_1.Entity)('tags')
], Tag);
//# sourceMappingURL=tag.entity.js.map