"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("../entities/category.entity");
let CategoriesService = class CategoriesService {
    categoryRepository;
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    async findAll() {
        const categories = await this.categoryRepository.find({
            relations: ['products'],
            order: { level: 'ASC', name: 'ASC' },
        });
        return categories.map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            parentId: category.parentId,
            level: category.level,
            productCount: category.products?.length || 0,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        }));
    }
    async create(createDto) {
        let level = 1;
        if (createDto.parentId) {
            const parent = await this.categoryRepository.findOne({
                where: { id: createDto.parentId },
            });
            if (!parent) {
                throw new common_1.NotFoundException('상위 카테고리를 찾을 수 없습니다');
            }
            level = parent.level + 1;
        }
        const category = this.categoryRepository.create({
            name: createDto.name,
            slug: createDto.slug,
            parentId: createDto.parentId || null,
            level,
        });
        return this.categoryRepository.save(category);
    }
    async update(id, updateDto) {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });
        if (!category) {
            throw new common_1.NotFoundException('카테고리를 찾을 수 없습니다');
        }
        if (updateDto.name !== undefined) {
            category.name = updateDto.name;
        }
        if (updateDto.slug !== undefined) {
            category.slug = updateDto.slug;
        }
        if (updateDto.parentId !== undefined) {
            if (updateDto.parentId === id) {
                throw new common_1.BadRequestException('자기 자신을 상위 카테고리로 설정할 수 없습니다');
            }
            if (updateDto.parentId) {
                const parent = await this.categoryRepository.findOne({
                    where: { id: updateDto.parentId },
                });
                if (!parent) {
                    throw new common_1.NotFoundException('상위 카테고리를 찾을 수 없습니다');
                }
                category.parentId = updateDto.parentId;
                category.level = parent.level + 1;
            }
            else {
                category.parentId = null;
                category.level = 1;
            }
        }
        return this.categoryRepository.save(category);
    }
    async delete(id) {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['products'],
        });
        if (!category) {
            throw new common_1.NotFoundException('카테고리를 찾을 수 없습니다');
        }
        const children = await this.categoryRepository.find({
            where: { parentId: id },
        });
        if (children.length > 0) {
            throw new common_1.BadRequestException('하위 카테고리가 있는 카테고리는 삭제할 수 없습니다');
        }
        if (category.products && category.products.length > 0) {
            throw new common_1.BadRequestException(`이 카테고리를 사용하는 상품이 ${category.products.length}개 있어 삭제할 수 없습니다. 먼저 상품의 카테고리를 변경해주세요.`);
        }
        await this.categoryRepository.remove(category);
        return { message: '카테고리가 삭제되었습니다' };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map