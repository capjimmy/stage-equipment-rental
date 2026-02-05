import { Repository } from 'typeorm';
import { RentalIssue, IssueType, IssueSeverity, IssueStatus } from '../entities/rental-issue.entity';
import { Rental } from '../entities/rental.entity';
export declare class RentalIssuesService {
    private rentalIssueRepository;
    private rentalRepository;
    constructor(rentalIssueRepository: Repository<RentalIssue>, rentalRepository: Repository<Rental>);
    create(rentalId: string, type: IssueType, severity: IssueSeverity, reportedBy: string, data: {
        impactNextBooking?: boolean;
        impactNotes?: string;
        impactCost?: number;
        evidencePhotos?: string[];
        additionalCharge?: number;
    }): Promise<RentalIssue>;
    findAll(status?: IssueStatus): Promise<RentalIssue[]>;
    findByRental(rentalId: string): Promise<RentalIssue[]>;
    findOne(id: string): Promise<RentalIssue>;
    updateStatus(id: string, status: IssueStatus, resolutionNotes?: string): Promise<RentalIssue>;
    setAdditionalCharge(id: string, additionalCharge: number): Promise<RentalIssue>;
    addEvidencePhotos(id: string, photoUrls: string[]): Promise<RentalIssue>;
    resolve(id: string, resolutionNotes: string): Promise<RentalIssue>;
    getStats(): Promise<{
        totalIssues: number;
        byType: Record<IssueType, number>;
        bySeverity: Record<IssueSeverity, number>;
        byStatus: Record<IssueStatus, number>;
        totalAdditionalCharges: number;
    }>;
}
