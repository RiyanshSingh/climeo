export interface SimulatorInputs {
  transport: number;
  meatDays: number;
  acHours: number;
  shopping: number;
  fashion: number;
}

export const BASELINE = {
  transport: 40,
  meatDays: 5,
  acHours: 8,
  shopping: 5,
  fashion: 4
};

export const calculateSimulatorSavings = (inputs: SimulatorInputs) => {
  const transportSavings = BASELINE.transport - inputs.transport;
  const meatSavings = (BASELINE.meatDays - inputs.meatDays) * 3;
  const acSavings = (BASELINE.acHours - inputs.acHours) * 0.5 * 7;
  const shoppingSavings = (BASELINE.shopping - inputs.shopping) * 1.5;
  const fashionSavings = (BASELINE.fashion - inputs.fashion) * 5;

  const totalWeeklyCO2Saved = transportSavings + meatSavings + acSavings + shoppingSavings + fashionSavings;
  const totalYearlyCO2Saved = totalWeeklyCO2Saved * 52;
  const moneySaved = totalWeeklyCO2Saved * 1.5;

  return {
    co2Weekly: totalWeeklyCO2Saved,
    co2Yearly: totalYearlyCO2Saved,
    moneyWeekly: moneySaved
  };
};
