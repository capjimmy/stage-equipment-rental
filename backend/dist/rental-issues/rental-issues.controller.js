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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalIssuesController = void 0;
const common_1 = require("@nestjs/common");
const rental_issues_service_1 = require("./rental-issues.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const user_entity_1 = require("../entities/user.entity");
const rental_issue_entity_1 = require("../entities/rental-issue.entity");
let RentalIssuesController = class RentalIssuesController {
    rentalIssuesService;
    constructor(rentalIssuesService) {
        this.rentalIssuesService = rentalIssuesService;
    }
    async create(req, data) {
        const { rentalId, type, severity, ...rest } = data;
        return this.rentalIssuesService.create(rentalId, type, severity, req.user.id, rest);
    }
    async findAll(status) {
        return this.rentalIssuesService.findAll(status);
    }
    async getStats() {
        return this.rentalIssuesService.getStats();
    }
    async findByRental(rentalId) {
        return this.rentalIssuesService.findByRental(rentalId);
    }
    async findOne(id) {
        return this.rentalIssuesService.findOne(id);
    }
    async updateStatus(id, data) {
        return this.rentalIssuesService.updateStatus(id, data.status, data.resolutionNotes);
    }
    async setAdditionalCharge(id, additionalCharge) {
        return this.rentalIssuesService.setAdditionalCharge(id, additionalCharge);
    }
    async addEvidencePhotos(id, photoUrls) {
        return this.rentalIssuesService.addEvidencePhotos(id, photoUrls);
    }
    async resolve(id, resolutionNotes) {
        return this.rentalIssuesService.resolve(id, resolutionNotes);
    }
};
exports.RentalIssuesController = RentalIssuesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RentalIssuesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPPLIER),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RentalIssuesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RentalIssuesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('rental/:rentalId'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPPLIER),
    __param(0, (0, common_1.Param)('rentalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RentalIssuesController.prototype, "findByRental", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPPLIER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RentalIssuesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RentalIssuesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/additional-charge'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('additionalCharge')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], RentalIssuesController.prototype, "setAdditionalCharge", null);
__decorate([
    (0, common_1.Patch)(':id/evidence-photos'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('photoUrls')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], RentalIssuesController.prototype, "addEvidencePhotos", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('resolutionNotes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RentalIssuesController.prototype, "resolve", null);
exports.RentalIssuesController = RentalIssuesController = __decorate([
    (0, common_1.Controller)('rental-issues'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [rental_issues_service_1.RentalIssuesService])
], RentalIssuesController);
//# sourceMappingURL=rental-issues.controller.js.map