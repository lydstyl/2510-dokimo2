import { describe, it, expect } from 'vitest';
import { Building } from '../Building';

describe('Building', () => {
  describe('create', () => {
    it('should create a valid building', () => {
      const building = Building.create({
        id: '1',
        name: 'Immeuble 123 Rue de Paris',
        address: '123 Rue de Paris',
        postalCode: '75001',
        city: 'Paris',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(building.id).toBe('1');
      expect(building.name).toBe('Immeuble 123 Rue de Paris');
      expect(building.address).toBe('123 Rue de Paris');
      expect(building.postalCode).toBe('75001');
      expect(building.city).toBe('Paris');
    });

    it('should throw error if name is empty', () => {
      expect(() =>
        Building.create({
          id: '1',
          name: '',
          address: '123 Rue de Paris',
          postalCode: '75001',
          city: 'Paris',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Building name cannot be empty');
    });

    it('should throw error if address is empty', () => {
      expect(() =>
        Building.create({
          id: '1',
          name: 'Immeuble 123',
          address: '',
          postalCode: '75001',
          city: 'Paris',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Building address cannot be empty');
    });

    it('should throw error if postal code is empty', () => {
      expect(() =>
        Building.create({
          id: '1',
          name: 'Immeuble 123',
          address: '123 Rue de Paris',
          postalCode: '',
          city: 'Paris',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Building postal code cannot be empty');
    });

    it('should throw error if city is empty', () => {
      expect(() =>
        Building.create({
          id: '1',
          name: 'Immeuble 123',
          address: '123 Rue de Paris',
          postalCode: '75001',
          city: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ).toThrow('Building city cannot be empty');
    });
  });

  describe('getFullAddress', () => {
    it('should return formatted full address', () => {
      const building = Building.create({
        id: '1',
        name: 'Immeuble 123',
        address: '123 Rue de Paris',
        postalCode: '75001',
        city: 'Paris',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(building.getFullAddress()).toBe('123 Rue de Paris, 75001 Paris');
    });
  });
});
