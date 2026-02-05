import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll() {
    const categories = await this.categoryRepository.find({
      relations: ['products'],
      order: { level: 'ASC', name: 'ASC' },
    });

    // 각 카테고리의 상품 개수 추가
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

  async create(createDto: { name: string; slug: string; parentId?: string }) {
    let level = 1;

    if (createDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('상위 카테고리를 찾을 수 없습니다');
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

  async update(id: string, updateDto: { name?: string; slug?: string; parentId?: string }) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다');
    }

    if (updateDto.name !== undefined) {
      category.name = updateDto.name;
    }

    if (updateDto.slug !== undefined) {
      category.slug = updateDto.slug;
    }

    if (updateDto.parentId !== undefined) {
      if (updateDto.parentId === id) {
        throw new BadRequestException('자기 자신을 상위 카테고리로 설정할 수 없습니다');
      }

      if (updateDto.parentId) {
        const parent = await this.categoryRepository.findOne({
          where: { id: updateDto.parentId },
        });

        if (!parent) {
          throw new NotFoundException('상위 카테고리를 찾을 수 없습니다');
        }

        category.parentId = updateDto.parentId;
        category.level = parent.level + 1;
      } else {
        category.parentId = null;
        category.level = 1;
      }
    }

    return this.categoryRepository.save(category);
  }

  async delete(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다');
    }

    // 하위 카테고리가 있는지 확인
    const children = await this.categoryRepository.find({
      where: { parentId: id },
    });

    if (children.length > 0) {
      throw new BadRequestException('하위 카테고리가 있는 카테고리는 삭제할 수 없습니다');
    }

    // 해당 카테고리를 사용하는 상품이 있는지 확인
    if (category.products && category.products.length > 0) {
      throw new BadRequestException(`이 카테고리를 사용하는 상품이 ${category.products.length}개 있어 삭제할 수 없습니다. 먼저 상품의 카테고리를 변경해주세요.`);
    }

    await this.categoryRepository.remove(category);

    return { message: '카테고리가 삭제되었습니다' };
  }
}
