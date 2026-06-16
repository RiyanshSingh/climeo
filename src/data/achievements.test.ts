import { describe, it, expect } from 'vitest';
import { achievementDefinitions } from './achievements';

describe('Milestones Achievements Logic Tests', () => {

  const getAchievement = (id: string) => {
    const ach = achievementDefinitions.find(a => a.id === id);
    if (!ach) throw new Error(`Achievement ${id} not found`);
    return ach;
  };

  describe('First Footprint (ID 1)', () => {
    it('should unlock when there is at least 1 activity', () => {
      const check = getAchievement('1').check;
      expect(check({}, [])).toBe(false);
      expect(check({}, [{ category: 'food' }])).toBe(true);
      expect(check({}, [{ category: 'food' }, { category: 'transport' }])).toBe(true);
    });
  });

  describe('Eco Commuter (ID 2)', () => {
    it('should unlock when user logs transport activity', () => {
      const check = getAchievement('2').check;
      expect(check({}, [])).toBe(false);
      expect(check({}, [{ category: 'food' }])).toBe(false);
      expect(check({}, [{ category: 'transport' }])).toBe(true);
    });
  });

  describe('Transit Titan (ID 3)', () => {
    it('should unlock when user logs at least 3 transport activities', () => {
      const check = getAchievement('3').check;
      expect(check({}, [])).toBe(false);
      expect(check({}, [{ category: 'transport' }, { category: 'transport' }])).toBe(false);
      expect(check({}, [
        { category: 'transport' },
        { category: 'food' },
        { category: 'transport' },
        { category: 'transport' }
      ])).toBe(true);
    });
  });

  describe('Plant Powered (ID 4)', () => {
    it('should unlock when user logs food activity', () => {
      const check = getAchievement('4').check;
      expect(check({}, [])).toBe(false);
      expect(check({}, [{ category: 'energy' }])).toBe(false);
      expect(check({}, [{ category: 'food' }])).toBe(true);
    });
  });

  describe('Green Diet (ID 5)', () => {
    it('should unlock when user logs at least 3 food activities', () => {
      const check = getAchievement('5').check;
      expect(check({}, [])).toBe(false);
      expect(check({}, [{ category: 'food' }, { category: 'food' }])).toBe(false);
      expect(check({}, [{ category: 'food' }, { category: 'food' }, { category: 'food' }])).toBe(true);
    });
  });

  describe('Power Savior (ID 6)', () => {
    it('should unlock when user logs energy activity', () => {
      const check = getAchievement('6').check;
      expect(check({}, [])).toBe(false);
      expect(check({}, [{ category: 'transport' }])).toBe(false);
      expect(check({}, [{ category: 'energy' }])).toBe(true);
    });
  });

  describe('Energy Ninja (ID 7)', () => {
    it('should unlock when user logs at least 3 energy activities', () => {
      const check = getAchievement('7').check;
      expect(check({}, [])).toBe(false);
      expect(check({}, [{ category: 'energy' }, { category: 'energy' }])).toBe(false);
      expect(check({}, [{ category: 'energy' }, { category: 'energy' }, { category: 'energy' }])).toBe(true);
    });
  });

  describe('Thrift Shopper (ID 8)', () => {
    it('should unlock when user logs shopping activity', () => {
      const check = getAchievement('8').check;
      expect(check({}, [])).toBe(false);
      expect(check({}, [{ category: 'food' }])).toBe(false);
      expect(check({}, [{ category: 'shopping' }])).toBe(true);
    });
  });

  describe('Streak Starter (ID 9)', () => {
    it('should unlock when streak is 3 or more', () => {
      const check = getAchievement('9').check;
      expect(check(null, [])).toBe(false);
      expect(check({ streak: 2 }, [])).toBe(false);
      expect(check({ streak: 3 }, [])).toBe(true);
      expect(check({ streak: 5 }, [])).toBe(true);
    });
  });

  describe('Persistent Planter (ID 10)', () => {
    it('should unlock when streak is 7 or more', () => {
      const check = getAchievement('10').check;
      expect(check(null, [])).toBe(false);
      expect(check({ streak: 6 }, [])).toBe(false);
      expect(check({ streak: 7 }, [])).toBe(true);
      expect(check({ streak: 15 }, [])).toBe(true);
    });
  });

  describe('Eco Score Starter (ID 11)', () => {
    it('should unlock when eco score is 60 or more', () => {
      const check = getAchievement('11').check;
      expect(check(null, [])).toBe(false);
      expect(check({ ecoScore: 59 }, [])).toBe(false);
      expect(check({ ecoScore: 60 }, [])).toBe(true);
      expect(check({ ecoScore: 75 }, [])).toBe(true);
    });
  });

  describe('Eco Warrior (ID 12)', () => {
    it('should unlock when eco score is 80 or more', () => {
      const check = getAchievement('12').check;
      expect(check(null, [])).toBe(false);
      expect(check({ ecoScore: 79 }, [])).toBe(false);
      expect(check({ ecoScore: 80 }, [])).toBe(true);
      expect(check({ ecoScore: 95 }, [])).toBe(true);
    });
  });

  describe('Super Saver (ID 13)', () => {
    it('should unlock when total carbon saved is 10kg or more', () => {
      const check = getAchievement('13').check;
      expect(check(null, [])).toBe(false);
      expect(check({ totalCO2Saved: 9.9 }, [])).toBe(false);
      expect(check({ totalCO2Saved: 10 }, [])).toBe(true);
      expect(check({ totalCO2Saved: 25 }, [])).toBe(true);
    });
  });

  describe('Carbon Conqueror (ID 14)', () => {
    it('should unlock when total carbon saved is 50kg or more', () => {
      const check = getAchievement('14').check;
      expect(check(null, [])).toBe(false);
      expect(check({ totalCO2Saved: 49 }, [])).toBe(false);
      expect(check({ totalCO2Saved: 50 }, [])).toBe(true);
      expect(check({ totalCO2Saved: 150 }, [])).toBe(true);
    });
  });

});
