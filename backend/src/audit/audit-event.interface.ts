export interface AuditEvent {
  id: string;
  actorId: string;
  action: string;
  subject: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
