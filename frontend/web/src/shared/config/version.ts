import { describeBuild } from '@/shared/config/buildInfo';

const supplied: unknown = import.meta.env.VITE_BUILD_IDENTITY;
const description = describeBuild(supplied);

export const versionLabel = description.label;

export const buildNumber = description.number;

export const buildVersion = description.version ?? 'не определена';

export const releaseVersion = buildVersion;
