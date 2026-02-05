import { Rental } from './rental.entity';
import { User } from './user.entity';
export declare enum IssueType {
    DAMAGE = "damage",
    DELAY = "delay",
    LOSS = "loss"
}
export declare enum IssueSeverity {
    MINOR = "minor",
    MAJOR = "major",
    TOTAL_LOSS = "total_loss"
}
export declare enum IssueStatus {
    DETECTED = "detected",
    NOTIFIED = "notified",
    NEGOTIATING = "negotiating",
    RESOLVED = "resolved",
    BILLED = "billed",
    PAID = "paid"
}
export declare class RentalIssue {
    id: string;
    rentalId: string;
    rental: Rental;
    type: IssueType;
    severity: IssueSeverity;
    impactNextBooking: boolean;
    impactNotes: string;
    impactCost: number;
    reportedBy: string;
    reporter: User;
    reportedAt: Date;
    evidencePhotos: string[];
    additionalCharge: number;
    status: IssueStatus;
    resolutionNotes: string;
    createdAt: Date;
    updatedAt: Date;
}
