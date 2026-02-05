import { TagsService } from './tags.service';
export declare class TagsController {
    private tagsService;
    constructor(tagsService: TagsService);
    findAll(): Promise<import("../entities").Tag[]>;
    create(tagData: any): Promise<import("../entities").Tag[]>;
}
