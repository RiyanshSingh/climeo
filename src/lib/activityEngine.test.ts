import { describe, it, expect } from 'vitest';
import { calculateActivityImpact, type ActivityInputs } from './activityEngine';

describe('Activity Logging Impact Calculations Engine', () => {

  const baseInputs: ActivityInputs = {
    activeTab: 'Transport',
    transportMode: 'walking',
    transportDistance: 5,
    foodMeal: 'vegetarian',
    foodQuantity: 1,
    energyAction: 'ac',
    energyValue: 2,
    shoppingAction: 'thrift',
    shoppingItem: 'clothing',
    shoppingQuantity: 1
  };

  describe('Transport Category', () => {
    it('should compute zero generated and maximum saved CO2 for walking', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Transport',
        transportMode: 'walking',
        transportDistance: 10
      });
      expect(impact.co2Generated).toBe(0);
      expect(impact.co2Saved).toBe(2.1); // 0.21 * 10 - 0 = 2.1
      expect(impact.title).toBe('Walked 10 km');
    });

    it('should compute zero generated and maximum saved CO2 for cycling', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Transport',
        transportMode: 'cycling',
        transportDistance: 10
      });
      expect(impact.co2Generated).toBe(0);
      expect(impact.co2Saved).toBe(2.1);
      expect(impact.title).toBe('Cycled 10 km');
    });

    it('should compute appropriate co2 for bus transit', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Transport',
        transportMode: 'bus',
        transportDistance: 20
      });
      expect(impact.co2Generated).toBe(1.6); // 0.08 * 20 = 1.6
      expect(impact.co2Saved).toBe(2.6); // 0.21 * 20 - 1.6 = 4.2 - 1.6 = 2.6
      expect(impact.title).toBe('Took bus 20 km');
    });

    it('should compute appropriate co2 for train transit', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Transport',
        transportMode: 'train',
        transportDistance: 50
      });
      expect(impact.co2Generated).toBe(2); // 0.04 * 50 = 2
      expect(impact.co2Saved).toBe(8.5); // 0.21 * 50 - 2 = 10.5 - 2 = 8.5
      expect(impact.title).toBe('Took train 50 km');
    });

    it('should compute appropriate co2 for EV driving', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Transport',
        transportMode: 'ev',
        transportDistance: 20
      });
      expect(impact.co2Generated).toBe(1); // 0.05 * 20 = 1
      expect(impact.co2Saved).toBe(3.2); // 0.21 * 20 - 1 = 4.2 - 1 = 3.2
      expect(impact.title).toBe('Drove EV 20 km');
    });

    it('should compute maximum generated and zero saved for gas car', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Transport',
        transportMode: 'car',
        transportDistance: 10
      });
      expect(impact.co2Generated).toBe(2.1);
      expect(impact.co2Saved).toBe(0);
      expect(impact.title).toBe('Drove Gas Car 10 km');
    });
  });

  describe('Food Category', () => {
    it('should calculate impact for vegan meals correctly', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Food',
        foodMeal: 'vegan',
        foodQuantity: 2
      });
      expect(impact.co2Generated).toBe(2.0); // 1.0 * 2 = 2.0
      expect(impact.co2Saved).toBe(18.0); // 10.0 * 2 - 2.0 = 18.0
      expect(impact.title).toBe('Ate 2 vegan meals');
    });

    it('should calculate impact for single vegetarian meal (no plural)', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Food',
        foodMeal: 'vegetarian',
        foodQuantity: 1
      });
      expect(impact.co2Generated).toBe(1.5);
      expect(impact.co2Saved).toBe(8.5); // 10.0 - 1.5 = 8.5
      expect(impact.title).toBe('Ate 1 vegetarian meal');
    });

    it('should calculate impact for chicken meals correctly', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Food',
        foodMeal: 'chicken',
        foodQuantity: 1
      });
      expect(impact.co2Generated).toBe(3.5);
      expect(impact.co2Saved).toBe(6.5);
      expect(impact.title).toBe('Ate 1 chicken meal');
    });

    it('should calculate impact for beef meals with zero saved', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Food',
        foodMeal: 'beef',
        foodQuantity: 2
      });
      expect(impact.co2Generated).toBe(20.0); // 10.0 * 2 = 20
      expect(impact.co2Saved).toBe(0); // 10.0 * 2 - 20 = 0
      expect(impact.title).toBe('Ate 2 beef meals');
    });
  });

  describe('Energy Category', () => {
    it('should calculate savings for AC shut down (single hour)', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Energy',
        energyAction: 'ac',
        energyValue: 1
      });
      expect(impact.co2Generated).toBe(0);
      expect(impact.co2Saved).toBe(1.2);
      expect(impact.title).toBe('Turned off AC for 1 hr');
    });

    it('should calculate savings for AC shut down (multiple hours)', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Energy',
        energyAction: 'ac',
        energyValue: 5
      });
      expect(impact.co2Generated).toBe(0);
      expect(impact.co2Saved).toBe(6.0);
      expect(impact.title).toBe('Turned off AC for 5 hrs');
    });

    it('should calculate savings for Solar offset correctly', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Energy',
        energyAction: 'solar',
        energyValue: 10
      });
      expect(impact.co2Generated).toBe(0);
      expect(impact.co2Saved).toBe(8.2); // 0.82 * 10 = 8.2
      expect(impact.title).toBe('Saved 10 kWh grid electricity via Solar');
    });
  });

  describe('Shopping Category', () => {
    it('should calculate thrift savings for clothing correctly', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Shopping',
        shoppingAction: 'thrift',
        shoppingItem: 'clothing',
        shoppingQuantity: 1
      });
      expect(impact.co2Generated).toBe(0);
      expect(impact.co2Saved).toBe(15.0);
      expect(impact.title).toBe('Thrifted 1 second-hand clothing item');
    });

    it('should calculate thrift savings for electronics correctly', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Shopping',
        shoppingAction: 'thrift',
        shoppingItem: 'electronics',
        shoppingQuantity: 2
      });
      expect(impact.co2Generated).toBe(0);
      expect(impact.co2Saved).toBe(100.0); // 50.0 * 2 = 100.0
      expect(impact.title).toBe('Thrifted 2 second-hand electronics items');
    });

    it('should calculate new buying impact for clothing correctly', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Shopping',
        shoppingAction: 'new',
        shoppingItem: 'clothing',
        shoppingQuantity: 3
      });
      expect(impact.co2Generated).toBe(45.0); // 15.0 * 3 = 45.0
      expect(impact.co2Saved).toBe(0);
      expect(impact.title).toBe('Bought 3 new clothing items');
    });

    it('should calculate new buying impact for electronics (single)', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Shopping',
        shoppingAction: 'new',
        shoppingItem: 'electronics',
        shoppingQuantity: 1
      });
      expect(impact.co2Generated).toBe(50.0);
      expect(impact.co2Saved).toBe(0);
      expect(impact.title).toBe('Bought 1 new electronics item');
    });

    it('should calculate single-use plastic bags refuse savings (single bag)', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Shopping',
        shoppingAction: 'plastic',
        shoppingQuantity: 1
      });
      expect(impact.co2Generated).toBe(0);
      expect(impact.co2Saved).toBe(0.1);
      expect(impact.title).toBe('Refused 1 single-use plastic bag');
    });

    it('should calculate single-use plastic bags refuse savings (multiple)', () => {
      const impact = calculateActivityImpact({
        ...baseInputs,
        activeTab: 'Shopping',
        shoppingAction: 'plastic',
        shoppingQuantity: 5
      });
      expect(impact.co2Generated).toBe(0);
      expect(impact.co2Saved).toBe(0.5); // 0.1 * 5 = 0.5
      expect(impact.title).toBe('Refused 5 single-use plastic bags');
    });
  });
});
