export const EMISSION_FACTORS = {
  transportation: {
    walking: 0,
    cycling: 0,
    bus: 0.08,   // kg CO2 per km
    train: 0.04, // kg CO2 per km
    car: 0.21,   // kg CO2 per km
    flight: 0.25 // kg CO2 per km
  },
  food: {
    vegetarian: 1.5, // kg CO2 per meal
    chicken: 3.5,    // kg CO2 per meal
    beef: 10,        // kg CO2 per meal
    dairy: 1         // kg CO2 per serving
  },
  home_energy: {
    electricity: 0.82, // kg CO2 per kWh
    ac_per_hour: 1.2   // estimated kg CO2 per hour of AC
  },
  shopping: {
    clothing: 15,      // average kg CO2 per item
    electronics: 50,   // average kg CO2 per item
    online_delivery: 2 // kg CO2 per delivery
  },
  waste: {
    plastic: 1.5,      // kg CO2 per kg of waste
    food: 2.5,         // kg CO2 per kg of food waste
    recyclable: 0.5    // kg CO2 per kg
  }
};

export function calculateTransportEmissions(mode: keyof typeof EMISSION_FACTORS.transportation, distanceKm: number): number {
  const factor = EMISSION_FACTORS.transportation[mode] || 0;
  return factor * distanceKm;
}

export function calculateFoodEmissions(mealType: keyof typeof EMISSION_FACTORS.food, quantity: number): number {
  const factor = EMISSION_FACTORS.food[mealType] || 0;
  return factor * quantity;
}

export function calculateEnergyEmissions(type: 'electricity' | 'ac_per_hour', units: number): number {
  const factor = EMISSION_FACTORS.home_energy[type] || 0;
  return factor * units;
}

export function calculateShoppingEmissions(category: keyof typeof EMISSION_FACTORS.shopping, quantity: number): number {
  const factor = EMISSION_FACTORS.shopping[category] || 0;
  return factor * quantity;
}

export function calculateWasteEmissions(type: keyof typeof EMISSION_FACTORS.waste, quantityKg: number): number {
  const factor = EMISSION_FACTORS.waste[type] || 0;
  return factor * quantityKg;
}

export function calculateCarbonScore(totalMonthlyImpact: number, baselineImpact: number = 300): number {
  // Simple normalization: If impact is 0, score is 100. If impact == baseline, score is 50. If > 2*baseline, score is 0.
  const normalizedImpact = (totalMonthlyImpact / baselineImpact) * 50;
  const score = 100 - normalizedImpact;
  return Math.max(0, Math.min(100, Math.round(score)));
}
