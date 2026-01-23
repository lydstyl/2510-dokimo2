import { IRentRevisionRepository } from './interfaces/IRentRevisionRepository';
import { RentRevisionStatus } from '../domain/RentRevision';

/**
 * Statistics about rent revisions for dashboard display
 */
export interface RevisionStats {
  urgentCount: number;                // Revisions within 2 months (EN_PREPARATION)
  enPreparationCount: number;         // All EN_PREPARATION revisions
  courrierEnvoyeCount: number;        // All COURRIER_AR_ENVOYE revisions
  upcomingCount: number;              // EN_PREPARATION revisions more than 2 months away
}

/**
 * Use case: Get rent revision statistics
 * Used by dashboard to show indicators
 */
export class GetRevisionStats {
  constructor(private repository: IRentRevisionRepository) {}

  async execute(): Promise<RevisionStats> {
    // Get all revisions in preparation
    const allEnPreparation = await this.repository.findByStatus(RentRevisionStatus.EN_PREPARATION);

    // Get all revisions with letter sent
    const allCourrierEnvoye = await this.repository.findByStatus(RentRevisionStatus.COURRIER_AR_ENVOYE);

    // Filter urgent revisions (within 2 months)
    const urgent = allEnPreparation.filter((revision) => revision.isUrgent());

    // Calculate upcoming revisions (more than 2 months away)
    const upcoming = allEnPreparation.filter((revision) => !revision.isUrgent());

    return {
      urgentCount: urgent.length,
      enPreparationCount: allEnPreparation.length,
      courrierEnvoyeCount: allCourrierEnvoye.length,
      upcomingCount: upcoming.length,
    };
  }
}
