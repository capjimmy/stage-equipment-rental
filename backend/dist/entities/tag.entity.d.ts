import { Product } from './product.entity';
export declare enum TagStatus {
    APPROVED = "approved",
    PENDING = "pending",
    BLOCKED = "blocked"
}
export declare enum TagType {
    COUNTRY = "country",
    ERA = "era",
    MOOD = "mood",
    PROP = "prop",
    GENRE = "genre",
    OTHER = "other"
}
export declare class Tag {
    id: string;
    name: string;
    type: TagType;
    synonyms: string[];
    status: TagStatus;
    createdBy: string;
    products: Product[];
    createdAt: Date;
    updatedAt: Date;
}
