import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
export declare class TagsService {
    private tagRepository;
    constructor(tagRepository: Repository<Tag>);
    findAll(): Promise<Tag[]>;
    create(tagData: any): Promise<Tag[]>;
}
