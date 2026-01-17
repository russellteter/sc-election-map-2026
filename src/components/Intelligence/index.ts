/**
 * Intelligence Components
 *
 * Strategic intelligence components powered by BallotReady and TargetSmart APIs.
 * These provide voter intelligence, mobilization data, and recruitment insights.
 */

import dynamic from 'next/dynamic';

// Lazy-loaded for code splitting
export const RecruitmentPipeline = dynamic(() => import('./RecruitmentPipeline'), {
  ssr: false,
});

export const ElectorateProfile = dynamic(() => import('./ElectorateProfile'), {
  ssr: false,
});

export const MobilizationCard = dynamic(() => import('./MobilizationCard'), {
  ssr: false,
});

export const EndorsementDashboard = dynamic(() => import('./EndorsementDashboard'), {
  ssr: false,
});
