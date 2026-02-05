import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<{
        id: string;
        name: string;
        slug: string;
        parentId: string | null;
        level: number;
        productCount: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(createDto: {
        name: string;
        slug: string;
        parentId?: string;
    }): Promise<import("../entities").Category>;
    update(id: string, updateDto: {
        name?: string;
        slug?: string;
        parentId?: string;
    }): Promise<import("../entities").Category>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
