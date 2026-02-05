import { RentalIssuesService } from './rental-issues.service';
import { IssueType, IssueSeverity, IssueStatus } from '../entities/rental-issue.entity';
export declare class RentalIssuesController {
    private rentalIssuesService;
    constructor(rentalIssuesService: RentalIssuesService);
    create(req: any, data: {
        rentalId: string;
        type: IssueType;
        severity: IssueSeverity;
        impactNextBooking?: boolean;
        impactNotes?: string;
        impactCost?: number;
        evidencePhotos?: string[];
        additionalCharge?: number;
    }): Promise<import("../entities/rental-issue.entity").RentalIssue>;
    findAll(status?: IssueStatus): Promise<import("../entities/rental-issue.entity").RentalIssue[]>;
    getStats(): Promise<{
        totalIssues: number;
        byType: Record<IssueType, number>;
        bySeverity: Record<IssueSeverity, number>;
        byStatus: Record<IssueStatus, number>;
        totalAdditionalCharges: number;
    }>;
    findByRental(rentalId: string): Promise<import("../entities/rental-issue.entity").RentalIssue[]>;
    findOne(id: string): Promise<import("../entities/rental-issue.entity").RentalIssue>;
    updateStatus(id: string, data: {
        status: IssueStatus;
        resolutionNotes?: string;
    }): Promise<import("../entities/rental-issue.entity").RentalIssue>;
    setAdditionalCharge(id: string, additionalCharge: number): Promise<import("../entities/rental-issue.entity").RentalIssue>;
    addEvidencePhotos(id: string, photoUrls: string[]): Promise<import("../entities/rental-issue.entity").RentalIssue>;
    resolve(id: string, resolutionNotes: string): Promise<import("../entities/rental-issue.entity").RentalIssue>;
}
