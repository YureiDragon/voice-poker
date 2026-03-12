import type { AIPersonality } from '../types';

export function generatePersonality(): AIPersonality {
  return {
    tightness: Math.random(),
    aggression: Math.random(),
    bluffFrequency: Math.random() * 0.5,
    positionalAwareness: Math.random(),
  };
}
