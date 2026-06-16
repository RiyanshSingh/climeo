export interface OnboardingAnswers {
  lifestyle: string;
  travelDistance: string;
  transportMode: string;
  dietType: string;
  energyUsage: string;
  shoppingFreq: string;
  flightsCount: string;
}

export const calculateCarbonDNA = (answers: OnboardingAnswers) => {
  // Mode Score
  let modeScore = 0;
  if (answers.transportMode === 'Walking/Cycling') modeScore = 0;
  else if (answers.transportMode === 'Public Transport') modeScore = 20;
  else if (answers.transportMode === 'Bike') modeScore = 40;
  else if (answers.transportMode === 'Mix') modeScore = 60;
  else if (answers.transportMode === 'Car') modeScore = 80;

  // Distance Factor
  let distFactor = 1.0;
  if (answers.travelDistance === 'Less than 20 km') distFactor = 0.5;
  else if (answers.travelDistance === '20 - 50 km') distFactor = 0.8;
  else if (answers.travelDistance === '50 - 100 km') distFactor = 1.0;
  else if (answers.travelDistance === '100 - 250 km') distFactor = 1.5;
  else if (answers.travelDistance === '250+ km') distFactor = 2.0;

  const transportScore = Math.min(100, modeScore * distFactor);

  // Food Score
  let foodScore = 25;
  if (answers.dietType === 'Vegan') foodScore = 10;
  else if (answers.dietType === 'Vegetarian') foodScore = 25;
  else if (answers.dietType === 'Eggetarian') foodScore = 40;
  else if (answers.dietType === 'Non-Veg (Occasional)') foodScore = 55;
  else if (answers.dietType === 'Non-Veg (Frequent)') foodScore = 70;

  // Energy Score
  let energyScore = 40;
  if (answers.energyUsage === 'No AC') energyScore = 20;
  else if (answers.energyUsage === '1-2 hrs/day') energyScore = 40;
  else if (answers.energyUsage === '3-6 hrs/day') energyScore = 60;
  else if (answers.energyUsage === '6-10 hrs/day') energyScore = 80;
  else if (answers.energyUsage === '10+ hrs/day') energyScore = 100;

  // Shopping Score
  let shoppingScore = 30;
  if (answers.shoppingFreq === 'Rarely') shoppingScore = 10;
  else if (answers.shoppingFreq === 'Monthly') shoppingScore = 30;
  else if (answers.shoppingFreq === 'Few times/month') shoppingScore = 50;
  else if (answers.shoppingFreq === 'Weekly') shoppingScore = 70;
  else if (answers.shoppingFreq === 'Multiple times/week') shoppingScore = 100;

  // Flight Score
  let flightScore = 0;
  if (answers.flightsCount === '0') flightScore = 0;
  else if (answers.flightsCount === '1-2') flightScore = 25;
  else if (answers.flightsCount === '3-5') flightScore = 60;
  else if (answers.flightsCount === '6-10') flightScore = 90;
  else if (answers.flightsCount === '10+') flightScore = 120;

  // Weighted Scores
  const wTransport = transportScore * 0.35;
  const wFood = foodScore * 0.25;
  const wEnergy = energyScore * 0.20;
  const wShopping = shoppingScore * 0.10;
  const wFlights = flightScore * 0.10;

  const totalWeighted = wTransport + wFood + wEnergy + wShopping + wFlights;

  // Clamp total risk score to 100
  const riskScore = Math.min(100, totalWeighted);

  // Starting Eco Score
  const ecoScore = Math.max(1, Math.min(100, Math.round(100 - riskScore)));

  // Estimated Footprint (tons CO2/yr)
  const annualFootprint = Number((1.0 + (riskScore * 0.1)).toFixed(1));
  const monthlyFootprint = Number((annualFootprint / 12).toFixed(2));

  // DNA Percentages
  const sumWeights = wTransport + wFood + wEnergy + wShopping + wFlights || 1;
  const transportPct = Math.round((wTransport / sumWeights) * 100);
  const foodPct = Math.round((wFood / sumWeights) * 100);
  const energyPct = Math.round((wEnergy / sumWeights) * 100);
  const shoppingPct = Math.round((wShopping / sumWeights) * 100);
  const flightsPct = Math.round((wFlights / sumWeights) * 100);

  // Main Impact Category
  const categories = [
    { name: 'Transportation', value: wTransport },
    { name: 'Food', value: wFood },
    { name: 'Energy', value: wEnergy },
    { name: 'Shopping', value: wShopping },
    { name: 'Flights', value: wFlights },
  ];
  categories.sort((a, b) => b.value - a.value);
  const firstCat = categories[0];
  const mainImpact = firstCat ? firstCat.name : 'Transportation';

  // Potential Reduction %
  const minPossibleWeighted = (0 * 0.35) + (10 * 0.25) + (20 * 0.20) + (10 * 0.10) + (0 * 0.10); // 7.5
  const reduction = totalWeighted > minPossibleWeighted 
    ? Math.max(10, Math.min(45, Math.round(((totalWeighted - minPossibleWeighted) / totalWeighted) * 40)))
    : 10;

  // Dynamic Recommendations based on top category
  let recommendationsList: string[];
  if (mainImpact === 'Transportation') {
    recommendationsList = [
      "Use buses, trains, or carpool for commutes.",
      "Cycle or walk for short trips under 2 km.",
      "Drive at constant speeds to improve vehicle mileage."
    ];
  } else if (mainImpact === 'Food') {
    recommendationsList = [
      "Include more plant-based meals in your weekly diet.",
      "Buy locally grown food to cut transportation pollution.",
      "Minimize food waste by planning your meals ahead."
    ];
  } else if (mainImpact === 'Energy') {
    recommendationsList = [
      "Set your AC temperature to 24°C or higher to save power.",
      "Turn off lights and AC when leaving the room.",
      "Line-dry clothes in the sun instead of using a dryer."
    ];
  } else if (mainImpact === 'Shopping') {
    recommendationsList = [
      "Buy used or vintage clothes instead of fast-fashion items.",
      "Use reusable bags when going grocery shopping.",
      "Consolidate online orders to reduce delivery trips."
    ];
  } else {
    recommendationsList = [
      "Consider train travel for domestic trips under 500 km.",
      "Purchase verified carbon offsets for necessary flights.",
      "Fly direct whenever possible to avoid take-off emissions."
    ];
  }

  return {
    ecoScore,
    annualFootprint,
    monthlyFootprint,
    transportPct,
    foodPct,
    energyPct,
    shoppingPct,
    flightsPct,
    mainImpact,
    reduction,
    recommendations: recommendationsList
  };
};
