import { designTokens } from '@/shared/config/design-tokens';

const n = (value: string | number) => Number.parseFloat(String(value));

export const photoMotionMetrics = {
  viewer: n(designTokens.motionDurationVibeViewer),
  viewerQuiet: n(designTokens.motionDurationVibeViewerWheelQuiet),
  viewerRatio: n(designTokens.componentMobileVibeViewerDistanceRatio),
  viewerFlickDistance: n(designTokens.componentMobileVibeViewerFlickDistance),
  minimumFlight: n(designTokens.motionDurationVibeFlightMinimum),
  maximumFlight: n(designTokens.motionDurationVibeFlightMaximum),
  returning: n(designTokens.motionDurationVibeReturn),
  assembly: n(designTokens.motionDurationVibeAssembly),
  quiet: n(designTokens.motionDurationVibeWheelQuiet),
  consumedQuiet: n(designTokens.motionDurationVibeWheelConsumedQuiet),
  velocityExpiry: n(designTokens.motionDurationVibeVelocityExpiry),
  velocitySample: n(designTokens.motionDurationVibeVelocitySampleMinimum),
  slop: n(designTokens.componentMobileVibeDragSlop),
  axisBias: n(designTokens.componentMobileVibeAxisBias),
  previousWeight: n(designTokens.componentMobileVibeVelocityPreviousWeight),
  latestWeight: n(designTokens.componentMobileVibeVelocityLatestWeight),
  minimumDistance: n(designTokens.componentMobileVibeDistanceMinimum),
  maximumDistance: n(designTokens.componentMobileVibeDistanceMaximum),
  distanceRatio: n(designTokens.componentMobileVibeDistanceRatio),
  flickDistance: n(designTokens.componentMobileVibeFlickDistance),
  flickVelocity: n(designTokens.componentMobileVibeFlickVelocityPerSecond) / 1000,
  verticalRatio: n(designTokens.componentMobileVibeVerticalDriftRatio),
  verticalMaximum: n(designTokens.componentMobileVibeVerticalDriftMaximum),
  flightBias: n(designTokens.componentMobileVibeFlightSpeedBias),
  progressRatio: n(designTokens.componentMobileVibeProgressViewportRatio),
  lineScale: n(designTokens.componentMobileVibeWheelLineScale),
  wheelCommit: n(designTokens.componentMobileVibeWheelCommitRatio),
};
