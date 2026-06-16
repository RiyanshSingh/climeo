export interface ActivityInputs {
  activeTab: 'Transport' | 'Food' | 'Energy' | 'Shopping';
  transportMode: 'walking' | 'cycling' | 'bus' | 'train' | 'ev' | 'car';
  transportDistance: number;
  foodMeal: 'vegan' | 'vegetarian' | 'chicken' | 'beef';
  foodQuantity: number;
  energyAction: 'ac' | 'solar';
  energyValue: number;
  shoppingAction: 'thrift' | 'new' | 'plastic';
  shoppingItem: 'clothing' | 'electronics';
  shoppingQuantity: number;
}

export const calculateActivityImpact = (inputs: ActivityInputs) => {
  let co2Generated = 0;
  let co2Saved = 0;
  let title = '';

  const {
    activeTab,
    transportMode,
    transportDistance,
    foodMeal,
    foodQuantity,
    energyAction,
    energyValue,
    shoppingAction,
    shoppingItem,
    shoppingQuantity
  } = inputs;

  if (activeTab === 'Transport') {
    let factor = 0;
    if (transportMode === 'walking') factor = 0;
    else if (transportMode === 'cycling') factor = 0;
    else if (transportMode === 'bus') factor = 0.08;
    else if (transportMode === 'train') factor = 0.04;
    else if (transportMode === 'ev') factor = 0.05;
    else if (transportMode === 'car') factor = 0.21;

    co2Generated = factor * transportDistance;
    // Saved relative to standard gas car
    co2Saved = Math.max(0, (0.21 * transportDistance) - co2Generated);

    const modeLabel = {
      walking: 'Walked',
      cycling: 'Cycled',
      bus: 'Took bus',
      train: 'Took train',
      ev: 'Drove EV',
      car: 'Drove Gas Car'
    }[transportMode];
    title = `${modeLabel} ${transportDistance} km`;

  } else if (activeTab === 'Food') {
    let factor = 0;
    if (foodMeal === 'vegan') factor = 1.0;
    else if (foodMeal === 'vegetarian') factor = 1.5;
    else if (foodMeal === 'chicken') factor = 3.5;
    else if (foodMeal === 'beef') factor = 10.0;

    co2Generated = factor * foodQuantity;
    // Saved relative to high-impact beef meal (10 kg CO2)
    co2Saved = Math.max(0, (10.0 * foodQuantity) - co2Generated);

    const mealLabel = {
      vegan: 'vegan meal',
      vegetarian: 'vegetarian meal',
      chicken: 'chicken meal',
      beef: 'beef meal'
    }[foodMeal];
    title = `Ate ${foodQuantity} ${mealLabel}${foodQuantity > 1 ? 's' : ''}`;

  } else if (activeTab === 'Energy') {
    if (energyAction === 'ac') {
      co2Generated = 0;
      co2Saved = 1.2 * energyValue; // AC per hour is 1.2 kg
      title = `Turned off AC for ${energyValue} hr${energyValue > 1 ? 's' : ''}`;
    } else {
      co2Generated = 0;
      co2Saved = 0.82 * energyValue; // Solar (0.82 kg saved per kWh)
      title = `Saved ${energyValue} kWh grid electricity via Solar`;
    }

  } else if (activeTab === 'Shopping') {
    if (shoppingAction === 'thrift') {
      co2Generated = 0;
      const factor = shoppingItem === 'clothing' ? 15.0 : 50.0;
      co2Saved = factor * shoppingQuantity;
      title = `Thrifted ${shoppingQuantity} second-hand ${shoppingItem} item${shoppingQuantity > 1 ? 's' : ''}`;
    } else if (shoppingAction === 'new') {
      const factor = shoppingItem === 'clothing' ? 15.0 : 50.0;
      co2Generated = factor * shoppingQuantity;
      co2Saved = 0;
      title = `Bought ${shoppingQuantity} new ${shoppingItem} item${shoppingQuantity > 1 ? 's' : ''}`;
    } else {
      co2Generated = 0;
      co2Saved = 0.1 * shoppingQuantity; // 0.1 kg saved per plastic bag
      title = `Refused ${shoppingQuantity} single-use plastic bag${shoppingQuantity > 1 ? 's' : ''}`;
    }
  }

  return {
    co2Generated: Number(co2Generated.toFixed(2)),
    co2Saved: Number(co2Saved.toFixed(2)),
    title
  };
};
