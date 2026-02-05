"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalIssuesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const rental_issues_service_1 = require("./rental-issues.service");
const rental_issues_controller_1 = require("./rental-issues.controller");
const rental_issue_entity_1 = require("../entities/rental-issue.entity");
const rental_entity_1 = require("../entities/rental.entity");
let RentalIssuesModule = class RentalIssuesModule {
};
exports.RentalIssuesModule = RentalIssuesModule;
exports.RentalIssuesModule = RentalIssuesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([rental_issue_entity_1.RentalIssue, rental_entity_1.Rental])],
        controllers: [rental_issues_controller_1.RentalIssuesController],
        providers: [rental_issues_service_1.RentalIssuesService],
        exports: [rental_issues_service_1.RentalIssuesService],
    })
], RentalIssuesModule);
//# sourceMappingURL=rental-issues.module.js.map