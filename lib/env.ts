import Constants from 'expo-constants';

/**
 * True when running inside the Expo Go sandbox (vs. a development or store
 * build). Some native features (push/scheduled notifications) are limited in
 * Expo Go, so we detect it and degrade gracefully instead of warning/crashing.
 */
export const isExpoGo = Constants.executionEnvironment === 'storeClient';
