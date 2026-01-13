import dynamic from 'next/dynamic';

// Always loaded (critical) - needed for initial page render
export { default as AddressInput } from './AddressInput';
export { default as AddressAutocomplete } from './AddressAutocomplete';
export { default as DistrictResults } from './DistrictResults';

// Import skeletons for re-export
import {
  RaceCardSkeleton,
  SectionHeaderSkeleton,
  StatewideRacesSkeleton,
  CongressionalRacesSkeleton,
  TimelineSkeleton,
  VoterResourcesSkeleton,
  KPISummarySkeleton,
  VoterGuidePageSkeleton,
} from './SkeletonLoaders';

// Lazy loaded with skeletons - code splitting for performance
export const StatewideRaces = dynamic(() => import('./StatewideRaces'), {
  ssr: false
});

export const JudicialRaces = dynamic(() => import('./JudicialRaces'), {
  ssr: false
});

export const CongressionalRaces = dynamic(() => import('./CongressionalRaces'), {
  ssr: false
});

export const CountyRaces = dynamic(() => import('./CountyRaces'), {
  ssr: false
});

export const SchoolBoardRaces = dynamic(() => import('./SchoolBoardRaces'), {
  ssr: false
});

export const SpecialDistricts = dynamic(() => import('./SpecialDistricts'), {
  ssr: false
});

export const BallotMeasures = dynamic(() => import('./BallotMeasures'), {
  ssr: false
});

export const VoterResources = dynamic(() => import('./VoterResources'), {
  ssr: false
});

// Re-export skeletons (always loaded for loading states)
export {
  RaceCardSkeleton,
  SectionHeaderSkeleton,
  StatewideRacesSkeleton,
  CongressionalRacesSkeleton,
  TimelineSkeleton,
  VoterResourcesSkeleton,
  KPISummarySkeleton,
  VoterGuidePageSkeleton,
};
