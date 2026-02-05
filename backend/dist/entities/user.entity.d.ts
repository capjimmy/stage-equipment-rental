import { Order } from './order.entity';
export declare enum UserRole {
    CUSTOMER = "customer",
    SUPPLIER = "supplier",
    ADMIN = "admin"
}
export declare enum UserStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    DELETED = "deleted"
}
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    name: string;
    phone: string;
    address: string;
    status: UserStatus;
    orders: Order[];
    createdAt: Date;
    updatedAt: Date;
}
