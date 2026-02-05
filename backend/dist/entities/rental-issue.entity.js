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
exports.RentalIssue = exports.IssueStatus = exports.IssueSeverity = exports.IssueType = void 0;
const typeorm_1 = require("typeorm");
const rental_entity_1 = require("./rental.entity");
const user_entity_1 = require("./user.entity");
var IssueType;
(function (IssueType) {
    IssueType["DAMAGE"] = "damage";
    IssueType["DELAY"] = "delay";
    IssueType["LOSS"] = "loss";
})(IssueType || (exports.IssueType = IssueType = {}));
var IssueSeverity;
(function (IssueSeverity) {
    IssueSeverity["MINOR"] = "minor";
    IssueSeverity["MAJOR"] = "major";
    IssueSeverity["TOTAL_LOSS"] = "total_loss";
})(IssueSeverity || (exports.IssueSeverity = IssueSeverity = {}));
var IssueStatus;
(function (IssueStatus) {
    IssueStatus["DETECTED"] = "detected";
    IssueStatus["NOTIFIED"] = "notified";
    IssueStatus["NEGOTIATING"] = "negotiating";
    IssueStatus["RESOLVED"] = "resolved";
    IssueStatus["BILLED"] = "billed";
    IssueStatus["PAID"] = "paid";
})(IssueStatus || (exports.IssueStatus = IssueStatus = {}));
let RentalIssue = class RentalIssue {
    id;
    rentalId;
    rental;
    type;
    severity;
    impactNextBooking;
    impactNotes;
    impactCost;
    reportedBy;
    reporter;
    reportedAt;
    evidencePhotos;
    additionalCharge;
    status;
    resolutionNotes;
    createdAt;
    updatedAt;
};
exports.RentalIssue = RentalIssue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RentalIssue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RentalIssue.prototype, "rentalId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rental_entity_1.Rental, (rental) => rental.issues),
    (0, typeorm_1.JoinColumn)({ name: 'rentalId' }),
    __metadata("design:type", rental_entity_1.Rental)
], RentalIssue.prototype, "rental", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
    }),
    __metadata("design:type", String)
], RentalIssue.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        nullable: true,
    }),
    __metadata("design:type", String)
], RentalIssue.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], RentalIssue.prototype, "impactNextBooking", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], RentalIssue.prototype, "impactNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RentalIssue.prototype, "impactCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], RentalIssue.prototype, "reportedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'reportedBy' }),
    __metadata("design:type", user_entity_1.User)
], RentalIssue.prototype, "reporter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], RentalIssue.prototype, "reportedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], RentalIssue.prototype, "evidencePhotos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], RentalIssue.prototype, "additionalCharge", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        default: IssueStatus.DETECTED,
    }),
    __metadata("design:type", String)
], RentalIssue.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], RentalIssue.prototype, "resolutionNotes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RentalIssue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RentalIssue.prototype, "updatedAt", void 0);
exports.RentalIssue = RentalIssue = __decorate([
    (0, typeorm_1.Entity)('rental_issues')
], RentalIssue);
//# sourceMappingURL=rental-issue.entity.js.map