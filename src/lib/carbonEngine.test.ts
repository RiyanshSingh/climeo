import { describe, it, expect } from 'vitest';
import { 
  calculateTransportEmissions, 
  calculateFoodEmissions, 
  calculateEnergyEmissions, 
  calculateShoppingEmissions, 
  calculateWasteEmissions, 
  calculateCarbonScore,
  EMISSION_FACTORS 
} from './carbonEngine';

describe('Carbon DNA Calculation Engine Tests', () => {
  
  describe('calculateTransportEmissions', () => {
    it('should calculate zero emissions for active transport (walking/cycling)', () => {
      expect(calculateTransportEmissions('walking', 10)).toBe(0);
      expect(calculateTransportEmissions('cycling', 25)).toBe(0);
    });

    it('should correctly calculate emissions for motor vehicles', () => {
      const distance = 100;
      const expectedCarEmissions = EMISSION_FACTORS.transportation.car * distance;
      const expectedBusEmissions = EMISSION_FACTORS.transportation.bus * distance;
      
      expect(calculateTransportEmissions('car', distance)).toBe(expectedCarEmissions);
      expect(calculateTransportEmissions('bus', distance)).toBe(expectedBusEmissions);
    });

    it('should correctly calculate emissions for train and flight', () => {
      expect(calculateTransportEmissions('train', 50)).toBe(EMISSION_FACTORS.transportation.train * 50);
      expect(calculateTransportEmissions('flight', 200)).toBe(EMISSION_FACTORS.transportation.flight * 200);
    });

    it('should fallback to 0 if transport mode is invalid or not defined', () => {
      // @ts-expect-error: testing invalid input runtime fallback
      expect(calculateTransportEmissions('spaceship', 500)).toBe(0);
    });
  });

  describe('calculateFoodEmissions', () => {
    it('should calculate correct emissions for dietary choices', () => {
      const meals = 3;
      expect(calculateFoodEmissions('vegetarian', meals)).toBe(1.5 * meals);
      expect(calculateFoodEmissions('chicken', meals)).toBe(3.5 * meals);
      expect(calculateFoodEmissions('beef', meals)).toBe(10 * meals);
    });

    it('should calculate dairy emissions correctly', () => {
      expect(calculateFoodEmissions('dairy', 5)).toBe(1 * 5);
    });

    it('should fallback to 0 for unknown meal type', () => {
      // @ts-expect-error: testing invalid input runtime fallback
      expect(calculateFoodEmissions('unknown_food', 2)).toBe(0);
    });
  });

  describe('calculateEnergyEmissions', () => {
    it('should calculate correct emissions for grid electricity and AC usage', () => {
      expect(calculateEnergyEmissions('electricity', 100)).toBe(0.82 * 100);
      expect(calculateEnergyEmissions('ac_per_hour', 5)).toBe(1.2 * 5);
    });

    it('should fallback to 0 for unknown energy type', () => {
      // @ts-expect-error: testing invalid input runtime fallback
      expect(calculateEnergyEmissions('wind', 10)).toBe(0);
    });
  });

  describe('calculateShoppingEmissions', () => {
    it('should calculate correct emissions for clothing and electronics', () => {
      expect(calculateShoppingEmissions('clothing', 4)).toBe(15 * 4);
      expect(calculateShoppingEmissions('electronics', 2)).toBe(50 * 2);
    });

    it('should calculate online delivery emissions', () => {
      expect(calculateShoppingEmissions('online_delivery', 3)).toBe(2 * 3);
    });

    it('should fallback to 0 for unknown shopping category', () => {
      // @ts-expect-error: testing invalid input runtime fallback
      expect(calculateShoppingEmissions('groceries', 1)).toBe(0);
    });
  });

  describe('calculateWasteEmissions', () => {
    it('should calculate correct emissions for waste disposal', () => {
      expect(calculateWasteEmissions('plastic', 5)).toBe(1.5 * 5);
      expect(calculateWasteEmissions('food', 10)).toBe(2.5 * 10);
    });

    it('should calculate recyclable waste emissions', () => {
      expect(calculateWasteEmissions('recyclable', 8)).toBe(0.5 * 8);
    });

    it('should fallback to 0 for unknown waste type', () => {
      // @ts-expect-error: testing invalid input runtime fallback
      expect(calculateWasteEmissions('hazardous', 5)).toBe(0);
    });
  });

  describe('calculateCarbonScore', () => {
    it('should return 100 if user impact is 0', () => {
      expect(calculateCarbonScore(0)).toBe(100);
    });

    it('should return 50 if user impact equals baseline', () => {
      expect(calculateCarbonScore(300, 300)).toBe(50);
    });

    it('should return 0 if user impact is double the baseline or higher', () => {
      expect(calculateCarbonScore(600, 300)).toBe(0);
      expect(calculateCarbonScore(1000, 300)).toBe(0);
    });

    it('should bound score between 0 and 100', () => {
      expect(calculateCarbonScore(-50, 300)).toBe(100);
    });

    it('should use default baseline of 300 when not specified', () => {
      expect(calculateCarbonScore(150)).toBe(75);
    });

    it('should return intermediate score for partial impact', () => {
      // 100 out of 300 baseline => score = 100 - (100/300)*50 ≈ 83
      expect(calculateCarbonScore(100, 300)).toBe(83);
    });
  });

});
