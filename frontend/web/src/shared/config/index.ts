export const isDemo = import.meta.env.MODE === 'demo';

export {
  buildNumber,
  buildVersion,
  releaseVersion,
  versionLabel,
} from '@/shared/config/version';
