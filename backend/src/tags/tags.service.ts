import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag, TagStatus } from '../entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  async findAll() {
    return this.tagRepository.find({
      where: { status: TagStatus.APPROVED },
      order: { name: 'ASC' },
    });
  }

  async create(tagData: any) {
    const tag = this.tagRepository.create({
      ...tagData,
      status: TagStatus.APPROVED, // Auto-approve tags created by admin
    });
    return this.tagRepository.save(tag);
  }
}
