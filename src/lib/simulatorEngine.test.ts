import { describe, it, expect } from 'vitest';
import { calculateSimulatorSavings, BASELINE } from './simulatorEngine';

describe('Carbon Twin Simulator Calculations Engine', () => {

  it('should calculate zero savings when inputs match baseline', () => {
    const savings = calculateSimulatorSavings(BASELINE);
    expect(savings.co2Weekly).toBe(0);
    expect(savings.co2Yearly).toBe(0);
    expect(savings.moneyWeekly).toBe(0);
  });

  it('should calculate positive savings when habits are improved (lower transport, meat, ac)', () => {
    const greenInputs = {
      transport: 10,  // saved 30
      meatDays: 2,    // saved 3 * 3 = 9
      acHours: 4,     // saved 4 * 0.5 * 7 = 14
      shopping: 2,    // saved 3 * 1.5 = 4.5
      fashion: 1      // saved 3 * 5 = 15
    };
    // Total weekly saved: 30 + 9 + 14 + 4.5 + 15 = 72.5 kg CO2
    const savings = calculateSimulatorSavings(greenInputs);
    expect(savings.co2Weekly).toBe(72.5);
    expect(savings.co2Yearly).toBe(72.5 * 52);
    expect(savings.moneyWeekly).toBe(72.5 * 1.5);
  });

  it('should calculate negative savings when habits deteriorate (higher emissions)', () => {
    const highEmissionInputs = {
      transport: 40,
      meatDays: 7, // worse by 2 days (meatDays - baseline.meatDays) => -2 * 3 = -6
      acHours: 10, // worse by 2 hours => -2 * 0.5 * 7 = -7
      shopping: 5,
      fashion: 4
    };
    const savings = calculateSimulatorSavings(highEmissionInputs);
    expect(savings.co2Weekly).toBe(-13);
  });
});
