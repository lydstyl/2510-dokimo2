import { describe, it, expect } from 'vitest';
import { Boiler } from '../Boiler';

describe('Boiler', () => {
  describe('create', () => {
    it('should create a boiler with valid data', () => {
      const boiler = Boiler.create({
        id: 'boiler-1',
        propertyId: 'property-1',
        name: 'Main Heating System',
        notes: 'Located in basement',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(boiler.id).toBe('boiler-1');
      expect(boiler.propertyId).toBe('property-1');
      expect(boiler.name).toBe('Main Heating System');
      expect(boiler.notes).toBe('Located in basement');
    });

    it('should create a boiler without optional name and notes', () => {
      const boiler = Boiler.create({
        id: 'boiler-1',
        propertyId: 'property-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(boiler.id).toBe('boiler-1');
      expect(boiler.propertyId).toBe('property-1');
      expect(boiler.name).toBeUndefined();
      expect(boiler.notes).toBeUndefined();
    });

    it('should throw error when id is missing', () => {
      expect(() => {
        Boiler.create({
          id: '',
          propertyId: 'property-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Boiler id is required');
    });

    it('should throw error when propertyId is missing', () => {
      expect(() => {
        Boiler.create({
          id: 'boiler-1',
          propertyId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Property id is required');
    });

    it('should throw error when createdAt is missing', () => {
      expect(() => {
        Boiler.create({
          id: 'boiler-1',
          propertyId: 'property-1',
          createdAt: null as any,
          updatedAt: new Date(),
        });
      }).toThrow('Created at is required');
    });

    it('should throw error when updatedAt is missing', () => {
      expect(() => {
        Boiler.create({
          id: 'boiler-1',
          propertyId: 'property-1',
          createdAt: new Date(),
          updatedAt: null as any,
        });
      }).toThrow('Updated at is required');
    });
  });

  describe('getters', () => {
    it('should expose all properties', () => {
      const now = new Date();
      const boiler = Boiler.create({
        id: 'boiler-1',
        propertyId: 'property-1',
        name: 'Main Boiler',
        notes: 'Serviced annually',
        createdAt: now,
        updatedAt: now,
      });

      expect(boiler.id).toBe('boiler-1');
      expect(boiler.propertyId).toBe('property-1');
      expect(boiler.name).toBe('Main Boiler');
      expect(boiler.notes).toBe('Serviced annually');
      expect(boiler.createdAt).toBe(now);
      expect(boiler.updatedAt).toBe(now);
    });
  });
});
