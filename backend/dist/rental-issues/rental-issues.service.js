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
exports.RentalIssuesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rental_issue_entity_1 = require("../entities/rental-issue.entity");
const rental_entity_1 = require("../entities/rental.entity");
let RentalIssuesService = class RentalIssuesService {
    rentalIssueRepository;
    rentalRepository;
    constructor(rentalIssueRepository, rentalRepository) {
        this.rentalIssueRepository = rentalIssueRepository;
        this.rentalRepository = rentalRepository;
    }
    async create(rentalId, type, severity, reportedBy, data) {
        const rental = await this.rentalRepository.findOne({
            where: { id: rentalId },
        });
        if (!rental) {
            throw new Error('Rental not found');
        }
        const issue = this.rentalIssueRepository.create({
            rentalId,
            type,
            severity,
            reportedBy,
            reportedAt: new Date(),
            status: rental_issue_entity_1.IssueStatus.DETECTED,
            ...data,
        });
        return this.rentalIssueRepository.save(issue);
    }
    async findAll(status) {
        const query = this.rentalIssueRepository
            .createQueryBuilder('issue')
            .leftJoinAndSelect('issue.rental', 'rental')
            .leftJoinAndSelect('rental.asset', 'asset')
            .leftJoinAndSelect('asset.product', 'product')
            .leftJoinAndSelect('rental.order', 'order')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('issue.reporter', 'reporter')
            .orderBy('issue.createdAt', 'DESC');
        if (status) {
            query.andWhere('issue.status = :status', { status });
        }
        return query.getMany();
    }
    async findByRental(rentalId) {
        return this.rentalIssueRepository.find({
            where: { rentalId },
            relations: ['reporter'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const issue = await this.rentalIssueRepository.findOne({
            where: { id },
            relations: [
                'rental',
                'rental.asset',
                'rental.asset.product',
                'rental.order',
                'rental.order.user',
                'reporter',
            ],
        });
        if (!issue) {
            throw new Error('Issue not found');
        }
        return issue;
    }
    async updateStatus(id, status, resolutionNotes) {
        const issue = await this.findOne(id);
        issue.status = status;
        if (resolutionNotes) {
            issue.resolutionNotes = resolutionNotes;
        }
        return this.rentalIssueRepository.save(issue);
    }
    async setAdditionalCharge(id, additionalCharge) {
        const issue = await this.findOne(id);
        issue.additionalCharge = additionalCharge;
        issue.status = rental_issue_entity_1.IssueStatus.BILLED;
        return this.rentalIssueRepository.save(issue);
    }
    async addEvidencePhotos(id, photoUrls) {
        const issue = await this.findOne(id);
        const currentPhotos = issue.evidencePhotos || [];
        issue.evidencePhotos = [...currentPhotos, ...photoUrls];
        return this.rentalIssueRepository.save(issue);
    }
    async resolve(id, resolutionNotes) {
        const issue = await this.findOne(id);
        issue.status = rental_issue_entity_1.IssueStatus.RESOLVED;
        issue.resolutionNotes = resolutionNotes;
        return this.rentalIssueRepository.save(issue);
    }
    async getStats() {
        const issues = await this.rentalIssueRepository.find();
        const stats = {
            totalIssues: issues.length,
            byType: {
                [rental_issue_entity_1.IssueType.DAMAGE]: 0,
                [rental_issue_entity_1.IssueType.DELAY]: 0,
                [rental_issue_entity_1.IssueType.LOSS]: 0,
            },
            bySeverity: {
                [rental_issue_entity_1.IssueSeverity.MINOR]: 0,
                [rental_issue_entity_1.IssueSeverity.MAJOR]: 0,
                [rental_issue_entity_1.IssueSeverity.TOTAL_LOSS]: 0,
            },
            byStatus: {
                [rental_issue_entity_1.IssueStatus.DETECTED]: 0,
                [rental_issue_entity_1.IssueStatus.NOTIFIED]: 0,
                [rental_issue_entity_1.IssueStatus.NEGOTIATING]: 0,
                [rental_issue_entity_1.IssueStatus.RESOLVED]: 0,
                [rental_issue_entity_1.IssueStatus.BILLED]: 0,
                [rental_issue_entity_1.IssueStatus.PAID]: 0,
            },
            totalAdditionalCharges: 0,
        };
        issues.forEach((issue) => {
            stats.byType[issue.type]++;
            if (issue.severity) {
                stats.bySeverity[issue.severity]++;
            }
            stats.byStatus[issue.status]++;
            stats.totalAdditionalCharges += Number(issue.additionalCharge);
        });
        return stats;
    }
};
exports.RentalIssuesService = RentalIssuesService;
exports.RentalIssuesService = RentalIssuesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rental_issue_entity_1.RentalIssue)),
    __param(1, (0, typeorm_1.InjectRepository)(rental_entity_1.Rental)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RentalIssuesService);
//# sourceMappingURL=rental-issues.service.js.map