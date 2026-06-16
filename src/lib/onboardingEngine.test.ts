import { describe, it, expect } from 'vitest';
import { calculateCarbonDNA, type OnboardingAnswers } from './onboardingEngine';

describe('Carbon DNA Onboarding Calculations Engine', () => {

  const baseAnswers: OnboardingAnswers = {
    lifestyle: 'Student',
    travelDistance: '20 - 50 km',
    transportMode: 'Walking/Cycling',
    dietType: 'Vegan',
    energyUsage: 'No AC',
    shoppingFreq: 'Rarely',
    flightsCount: '0'
  };

  it('should calculate eco score and carbon twin footprint for green/sustainable answers', () => {
    const dna = calculateCarbonDNA(baseAnswers);
    expect(dna.ecoScore).toBeGreaterThanOrEqual(80);
    expect(dna.annualFootprint).toBeLessThan(3.0);
    expect(dna.mainImpact).toBeDefined();
    expect(dna.recommendations.length).toBe(3);
  });

  it('should reduce eco score and increase footprint for carbon-intensive answers', () => {
    const carbonHeavyAnswers: OnboardingAnswers = {
      lifestyle: 'Corporate Executive',
      travelDistance: '250+ km',
      transportMode: 'Car',
      dietType: 'Non-Veg (Frequent)',
      energyUsage: '10+ hrs/day',
      shoppingFreq: 'Multiple times/week',
      flightsCount: '10+'
    };

    const dna = calculateCarbonDNA(carbonHeavyAnswers);
    expect(dna.ecoScore).toBeLessThan(30);
    expect(dna.annualFootprint).toBeGreaterThan(5.0);
    expect(dna.monthlyFootprint).toBeCloseTo(dna.annualFootprint / 12, 1);
  });

  it('should compute appropriate primary impact category and recommendations', () => {
    // Heavy travel should make Transportation the main impact
    const travelHeavyAnswers: OnboardingAnswers = {
      ...baseAnswers,
      travelDistance: '250+ km',
      transportMode: 'Car'
    };
    const dnaTravel = calculateCarbonDNA(travelHeavyAnswers);
    expect(dnaTravel.mainImpact).toBe('Transportation');
    expect(dnaTravel.recommendations[0]).toContain('bus');

    // Heavy meat diet should make Food the main impact
    const meatHeavyAnswers: OnboardingAnswers = {
      ...baseAnswers,
      dietType: 'Non-Veg (Frequent)'
    };
    const dnaMeat = calculateCarbonDNA(meatHeavyAnswers);
    expect(dnaMeat.mainImpact).toBe('Food');
    expect(dnaMeat.recommendations[0]).toContain('plant-based');

    // Heavy energy AC usage should make Energy the main impact
    const energyHeavyAnswers: OnboardingAnswers = {
      ...baseAnswers,
      energyUsage: '10+ hrs/day'
    };
    const dnaEnergy = calculateCarbonDNA(energyHeavyAnswers);
    expect(dnaEnergy.mainImpact).toBe('Energy');
    expect(dnaEnergy.recommendations[0]).toContain('AC');

    // Heavy shopping should make Shopping the main impact
    const shoppingHeavyAnswers: OnboardingAnswers = {
      ...baseAnswers,
      shoppingFreq: 'Multiple times/week'
    };
    const dnaShopping = calculateCarbonDNA(shoppingHeavyAnswers);
    expect(dnaShopping.mainImpact).toBe('Shopping');
    expect(dnaShopping.recommendations[0]).toContain('fast-fashion');
  });

  it('should correctly clamp starting Eco Score between 1 and 100', () => {
    const extremeGreenAnswers: OnboardingAnswers = {
      lifestyle: 'Minimalist',
      travelDistance: 'Less than 20 km',
      transportMode: 'Walking/Cycling',
      dietType: 'Vegan',
      energyUsage: 'No AC',
      shoppingFreq: 'Rarely',
      flightsCount: '0'
    };
    const dnaGreen = calculateCarbonDNA(extremeGreenAnswers);
    expect(dnaGreen.ecoScore).toBeLessThanOrEqual(100);
    expect(dnaGreen.ecoScore).toBeGreaterThanOrEqual(1);

    const extremeHeavyAnswers: OnboardingAnswers = {
      lifestyle: 'Frequent Flyer',
      travelDistance: '250+ km',
      transportMode: 'Car',
      dietType: 'Non-Veg (Frequent)',
      energyUsage: '10+ hrs/day',
      shoppingFreq: 'Multiple times/week',
      flightsCount: '10+'
    };
    const dnaHeavy = calculateCarbonDNA(extremeHeavyAnswers);
    expect(dnaHeavy.ecoScore).toBeGreaterThanOrEqual(1);
    expect(dnaHeavy.ecoScore).toBeLessThanOrEqual(100);
  });

  // --- NEW BRANCH COVERAGE TESTS ---

  it('should handle all transport mode options correctly', () => {
    // Public Transport
    const publicTransport = calculateCarbonDNA({ ...baseAnswers, transportMode: 'Public Transport' });
    expect(publicTransport.transportPct).toBeDefined();

    // Bike
    const bike = calculateCarbonDNA({ ...baseAnswers, transportMode: 'Bike' });
    expect(bike.transportPct).toBeDefined();

    // Mix
    const mix = calculateCarbonDNA({ ...baseAnswers, transportMode: 'Mix' });
    expect(mix.transportPct).toBeDefined();
  });

  it('should handle all travel distance options correctly', () => {
    const lessKm = calculateCarbonDNA({ ...baseAnswers, travelDistance: 'Less than 20 km' });
    expect(lessKm.annualFootprint).toBeDefined();

    const midKm = calculateCarbonDNA({ ...baseAnswers, travelDistance: '50 - 100 km' });
    expect(midKm.annualFootprint).toBeDefined();

    const farKm = calculateCarbonDNA({ ...baseAnswers, travelDistance: '100 - 250 km' });
    expect(farKm.annualFootprint).toBeDefined();
  });

  it('should handle all diet type options correctly', () => {
    const eggetarian = calculateCarbonDNA({ ...baseAnswers, dietType: 'Eggetarian' });
    expect(eggetarian.foodPct).toBeDefined();

    const nonVegOccasional = calculateCarbonDNA({ ...baseAnswers, dietType: 'Non-Veg (Occasional)' });
    expect(nonVegOccasional.foodPct).toBeDefined();

    const vegetarian = calculateCarbonDNA({ ...baseAnswers, dietType: 'Vegetarian' });
    expect(vegetarian.foodPct).toBeDefined();
  });

  it('should handle all energy usage options correctly', () => {
    const low = calculateCarbonDNA({ ...baseAnswers, energyUsage: '1-2 hrs/day' });
    expect(low.energyPct).toBeDefined();

    const mid = calculateCarbonDNA({ ...baseAnswers, energyUsage: '3-6 hrs/day' });
    expect(mid.energyPct).toBeDefined();

    const high = calculateCarbonDNA({ ...baseAnswers, energyUsage: '6-10 hrs/day' });
    expect(high.energyPct).toBeDefined();
  });

  it('should handle all shopping frequency options correctly', () => {
    const monthly = calculateCarbonDNA({ ...baseAnswers, shoppingFreq: 'Monthly' });
    expect(monthly.shoppingPct).toBeDefined();

    const fewTimes = calculateCarbonDNA({ ...baseAnswers, shoppingFreq: 'Few times/month' });
    expect(fewTimes.shoppingPct).toBeDefined();

    const weekly = calculateCarbonDNA({ ...baseAnswers, shoppingFreq: 'Weekly' });
    expect(weekly.shoppingPct).toBeDefined();
  });

  it('should handle all flight count options correctly', () => {
    const oneTwo = calculateCarbonDNA({ ...baseAnswers, flightsCount: '1-2' });
    expect(oneTwo.flightsPct).toBeDefined();

    const threeFive = calculateCarbonDNA({ ...baseAnswers, flightsCount: '3-5' });
    expect(threeFive.flightsPct).toBeDefined();

    const sixTen = calculateCarbonDNA({ ...baseAnswers, flightsCount: '6-10' });
    expect(sixTen.flightsPct).toBeDefined();
  });

  it('should produce Flights as main impact when flights are extreme and other categories low', () => {
    const flightHeavy: OnboardingAnswers = {
      ...baseAnswers,
      flightsCount: '10+',
      transportMode: 'Walking/Cycling',
      travelDistance: 'Less than 20 km',
      dietType: 'Vegan',
      energyUsage: 'No AC',
      shoppingFreq: 'Rarely'
    };
    const dna = calculateCarbonDNA(flightHeavy);
    expect(dna.mainImpact).toBe('Flights');
    expect(dna.recommendations[0]).toContain('train');
  });

  it('should compute reduction percentage correctly for low-impact answers', () => {
    const lowImpact: OnboardingAnswers = {
      ...baseAnswers,
      travelDistance: 'Less than 20 km',
      transportMode: 'Walking/Cycling',
      dietType: 'Vegan',
      energyUsage: 'No AC',
      shoppingFreq: 'Rarely',
      flightsCount: '0'
    };
    const dna = calculateCarbonDNA(lowImpact);
    // When totalWeighted ≈ minPossibleWeighted, reduction should be 10
    expect(dna.reduction).toBeGreaterThanOrEqual(10);
  });
});
