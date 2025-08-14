import { storage } from "../storage";

interface Discrepancy {
  type: string;
  expected: number;
  actual: number;
  variance: number;
  description: string;
}

class MassBalanceService {
  async validateChain(chainId: string) {
    const chain = await storage.getCustodyChain(chainId);
    if (!chain) {
      throw new Error("Chain not found");
    }

    const events = await storage.getMassBalanceEventsByChain(chainId);
    
    let totalInput = 0;
    let totalOutput = 0;
    let totalWaste = 0;
    const discrepancies: Discrepancy[] = [];

    // Calculate totals from events
    for (const event of events) {
      totalInput += parseFloat(event.inputQuantity) || 0;
      totalOutput += parseFloat(event.outputQuantity) || 0;
      totalWaste += parseFloat(event.wasteQuantity) || 0;
    }

    // Check if input equals output + waste (within tolerance)
    const tolerance = 0.01; // 1% tolerance
    const expectedBalance = totalInput;
    const actualBalance = totalOutput + totalWaste;
    const variance = Math.abs(expectedBalance - actualBalance);
    const variancePercentage = variance / expectedBalance * 100;

    if (variancePercentage > tolerance) {
      discrepancies.push({
        type: 'mass_balance',
        expected: expectedBalance,
        actual: actualBalance,
        variance: variance,
        description: `Mass balance discrepancy: ${variance.toFixed(4)} kg difference (${variancePercentage.toFixed(2)}%)`,
      });
    }

    // Check individual event ratios
    for (const event of events) {
      if (event.conversionRate) {
        const expectedOutput = parseFloat(event.inputQuantity) * parseFloat(event.conversionRate);
        const actualOutput = parseFloat(event.outputQuantity);
        const outputVariance = Math.abs(expectedOutput - actualOutput);
        
        if (outputVariance > (expectedOutput * tolerance)) {
          discrepancies.push({
            type: 'conversion_rate',
            expected: expectedOutput,
            actual: actualOutput,
            variance: outputVariance,
            description: `Conversion rate discrepancy in event ${event.id}: expected ${expectedOutput.toFixed(4)} kg, actual ${actualOutput.toFixed(4)} kg`,
          });
        }
      }
    }

    // Calculate efficiency
    const efficiency = totalOutput / totalInput * 100;

    return {
      isValid: discrepancies.length === 0,
      totalInput,
      totalOutput,
      totalWaste,
      efficiency,
      discrepancies,
    };
  }

  async recordEvent(input: any) {
    // Validate conversion rates and quantities
    if (input.conversionRate && input.inputQuantity) {
      const expectedOutput = input.inputQuantity * input.conversionRate;
      const tolerance = expectedOutput * 0.01; // 1% tolerance
      
      if (Math.abs(input.outputQuantity - expectedOutput) > tolerance) {
        console.warn(`Mass balance warning: Expected output ${expectedOutput}, actual ${input.outputQuantity}`);
      }
    }

    return await storage.createMassBalanceEvent({
      ...input,
      processDate: new Date(),
    });
  }

  async getChainEfficiency(chainId: string, timeRange?: { start: Date; end: Date }) {
    const events = await storage.getMassBalanceEventsByChain(chainId, timeRange);
    
    if (events.length === 0) {
      return {
        averageEfficiency: 0,
        eventCount: 0,
        totalInput: 0,
        totalOutput: 0,
        totalWaste: 0,
      };
    }

    let totalInput = 0;
    let totalOutput = 0;
    let totalWaste = 0;

    for (const event of events) {
      totalInput += parseFloat(event.inputQuantity) || 0;
      totalOutput += parseFloat(event.outputQuantity) || 0;
      totalWaste += parseFloat(event.wasteQuantity) || 0;
    }

    const averageEfficiency = totalOutput / totalInput * 100;

    return {
      averageEfficiency,
      eventCount: events.length,
      totalInput,
      totalOutput,
      totalWaste,
    };
  }

  async getFacilityEfficiency(facilityId: string, timeRange?: { start: Date; end: Date }) {
    const events = await storage.getMassBalanceEventsByFacility(facilityId, timeRange);
    
    const facilitySummary = {
      totalEvents: events.length,
      totalInput: 0,
      totalOutput: 0,
      totalWaste: 0,
      averageEfficiency: 0,
      eventsByType: {} as Record<string, number>,
    };

    for (const event of events) {
      facilitySummary.totalInput += parseFloat(event.inputQuantity) || 0;
      facilitySummary.totalOutput += parseFloat(event.outputQuantity) || 0;
      facilitySummary.totalWaste += parseFloat(event.wasteQuantity) || 0;
      
      if (!facilitySummary.eventsByType[event.eventType]) {
        facilitySummary.eventsByType[event.eventType] = 0;
      }
      facilitySummary.eventsByType[event.eventType]++;
    }

    if (facilitySummary.totalInput > 0) {
      facilitySummary.averageEfficiency = facilitySummary.totalOutput / facilitySummary.totalInput * 100;
    }

    return facilitySummary;
  }

  async detectAnomalies(facilityId?: string, timeRange?: { start: Date; end: Date }) {
    const events = facilityId 
      ? await storage.getMassBalanceEventsByFacility(facilityId, timeRange)
      : await storage.getMassBalanceEvents(timeRange);

    const anomalies: any[] = [];
    const conversionRates = new Map<string, number[]>();

    // Collect conversion rates by event type
    for (const event of events) {
      if (event.conversionRate) {
        if (!conversionRates.has(event.eventType)) {
          conversionRates.set(event.eventType, []);
        }
        conversionRates.get(event.eventType)!.push(parseFloat(event.conversionRate));
      }
    }

    // Calculate statistics and detect outliers
    for (const [eventType, rates] of conversionRates) {
      const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - average, 2), 0) / rates.length;
      const standardDeviation = Math.sqrt(variance);

      // Flag events with conversion rates more than 2 standard deviations from mean
      for (const event of events) {
        if (event.eventType === eventType && event.conversionRate) {
          const rate = parseFloat(event.conversionRate);
          const zScore = Math.abs((rate - average) / standardDeviation);
          
          if (zScore > 2) {
            anomalies.push({
              eventId: event.id,
              type: 'conversion_rate_anomaly',
              severity: zScore > 3 ? 'high' : 'medium',
              description: `Unusual conversion rate: ${rate.toFixed(4)} (${zScore.toFixed(2)} standard deviations from mean)`,
              eventType,
              value: rate,
              expectedRange: {
                min: average - 2 * standardDeviation,
                max: average + 2 * standardDeviation,
              },
            });
          }
        }
      }
    }

    // Check for quantity anomalies
    const quantities = events.map(e => parseFloat(e.inputQuantity) || 0);
    if (quantities.length > 0) {
      const avgQuantity = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
      const maxQuantity = Math.max(...quantities);
      
      // Flag quantities more than 10x the average
      for (const event of events) {
        const quantity = parseFloat(event.inputQuantity) || 0;
        if (quantity > avgQuantity * 10) {
          anomalies.push({
            eventId: event.id,
            type: 'quantity_anomaly',
            severity: 'medium',
            description: `Unusually large input quantity: ${quantity.toFixed(2)} kg (${(quantity / avgQuantity).toFixed(1)}x average)`,
            value: quantity,
            averageValue: avgQuantity,
          });
        }
      }
    }

    return anomalies;
  }
}

export const massBalanceService = new MassBalanceService();