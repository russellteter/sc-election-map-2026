/**
 * Recruitment Radar Components
 *
 * Phase 15-03: Candidate Recruitment Radar
 * Identifies and ranks districts needing Democratic candidates.
 */

export { default as RecruitmentRadar, UrgencyBadge, TargetCard } from './RecruitmentRadar';
export {
  useRecruitmentRadar,
  type RecruitmentTarget,
  type RecruitmentSummary,
} from '@/hooks/useRecruitmentRadar';
