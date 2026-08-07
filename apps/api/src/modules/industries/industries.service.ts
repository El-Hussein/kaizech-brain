import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IndustryEntity } from '@kaizech/database';

@Injectable()
export class IndustriesService {
  constructor(
    @InjectRepository(IndustryEntity)
    private readonly industryRepo: Repository<IndustryEntity>,
  ) {}

  async findAll() {
    return this.industryRepo.find({ 
      order: { name: 'ASC' },
      relations: ['knowledgeSources']
    });
  }

  async findOne(id: string) {
    const industry = await this.industryRepo.findOne({ where: { id } });
    if (!industry) throw new NotFoundException('Industry not found');
    return industry;
  }

  async create(data: { name: string; slug: string; description?: string }) {
    const industry = this.industryRepo.create(data);
    return this.industryRepo.save(industry);
  }

  async update(id: string, data: { name?: string; slug?: string; description?: string; status?: string }) {
    const industry = await this.findOne(id);
    Object.assign(industry, data);
    return this.industryRepo.save(industry);
  }

  async remove(id: string) {
    const industry = await this.findOne(id);
    await this.industryRepo.softRemove(industry);
    return { success: true };
  }
}
