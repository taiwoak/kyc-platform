import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditEventEntity } from './entities/audit-event.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEventEntity)
    private readonly repo: Repository<AuditEventEntity>,
  ) {}

  record(input: { actorId: string; action: string; subject?: string; metadata?: Record<string, unknown> }): void {
    const event = this.repo.create(input);
    void this.repo.save(event);
  }

  list(): Promise<AuditEventEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
