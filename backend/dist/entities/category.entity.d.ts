import { Product } from './product.entity';
export declare class Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parent: Category;
    children: Category[];
    level: number;
    products: Product[];
    createdAt: Date;
    updatedAt: Date;
}
