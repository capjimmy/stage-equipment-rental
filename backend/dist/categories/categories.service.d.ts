import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
export declare class CategoriesService {
    private categoryRepository;
    constructor(categoryRepository: Repository<Category>);
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
    }): Promise<Category>;
    update(id: string, updateDto: {
        name?: string;
        slug?: string;
        parentId?: string;
    }): Promise<Category>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
