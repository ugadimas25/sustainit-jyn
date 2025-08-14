import { storage } from "../storage";
import { v4 as uuidv4 } from "uuid";

interface SplitDefinition {
  quantity: number;
  destinationFacilityId?: string;
  qualityGrade?: string;
}

interface SplitChainInput {
  parentChainId: string;
  splits: SplitDefinition[];
  processLocationId: string;
  notes?: string;
}

interface MergeChainInput {
  parentChainIds: string[];
  destinationFacilityId: string;
  productType: string;
  qualityGrade?: string;
  processLocationId: string;
  notes?: string;
}

class ChainOfCustodyService {
  async createChain(input: any) {
    // Generate unique chain ID
    const chainId = `CHAIN-${Date.now().toString(36).toUpperCase()}`;
    
    const chain = await storage.createCustodyChain({
      ...input,
      chainId,
      remainingQuantity: input.totalQuantity,
      status: 'active'
    });

    // Record initial creation event
    await this.recordEvent({
      chainId: chain.id,
      eventType: 'creation',
      businessStep: 'harvesting',
      disposition: 'active',
      quantity: input.totalQuantity,
      locationId: input.sourceFacilityId,
    });

    return chain;
  }

  async recordEvent(input: any) {
    return await storage.createCustodyEvent({
      ...input,
      eventTime: new Date(),
    });
  }

  async splitChain(input: SplitChainInput) {
    const parentChain = await storage.getCustodyChain(input.parentChainId);
    if (!parentChain) {
      throw new Error("Parent chain not found");
    }

    // Validate split quantities
    const totalSplitQuantity = input.splits.reduce((sum, split) => sum + split.quantity, 0);
    if (totalSplitQuantity > parentChain.remainingQuantity) {
      throw new Error("Split quantities exceed remaining quantity");
    }

    // Create child chains
    const childChains = [];
    for (const split of input.splits) {
      const childChainId = `SPLIT-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 8)}`;
      
      const childChain = await storage.createCustodyChain({
        chainId: childChainId,
        sourceFacilityId: parentChain.destinationFacilityId,
        destinationFacilityId: split.destinationFacilityId,
        productType: parentChain.productType,
        totalQuantity: split.quantity,
        remainingQuantity: split.quantity,
        status: 'active',
        qualityGrade: split.qualityGrade || parentChain.qualityGrade,
        batchNumber: parentChain.batchNumber,
        harvestDate: parentChain.harvestDate,
      });

      childChains.push(childChain);

      // Record split event for child chain
      await this.recordEvent({
        chainId: childChain.id,
        eventType: 'aggregation',
        businessStep: 'processing',
        disposition: 'active',
        quantity: split.quantity,
        locationId: input.processLocationId,
      });
    }

    // Update parent chain remaining quantity
    const newRemainingQuantity = parentChain.remainingQuantity - totalSplitQuantity;
    await storage.updateCustodyChain(input.parentChainId, {
      remainingQuantity: newRemainingQuantity,
      status: newRemainingQuantity > 0 ? 'active' : 'completed'
    });

    // Record mass balance event
    const massBalanceEvent = await storage.createMassBalanceEvent({
      eventType: 'split',
      parentChainId: input.parentChainId,
      childChainIds: childChains.map(chain => chain.id),
      inputQuantity: totalSplitQuantity,
      outputQuantity: totalSplitQuantity,
      conversionRate: 1.0,
      wasteQuantity: 0,
      processLocation: input.processLocationId,
      notes: input.notes,
    });

    return {
      parentChain,
      childChains,
      massBalanceEvent,
    };
  }

  async mergeChains(input: MergeChainInput) {
    const parentChains = await Promise.all(
      input.parentChainIds.map(id => storage.getCustodyChain(id))
    );

    // Validate all parent chains exist
    if (parentChains.some(chain => !chain)) {
      throw new Error("One or more parent chains not found");
    }

    // Calculate total quantity
    const totalQuantity = parentChains.reduce((sum, chain) => sum + chain.remainingQuantity, 0);

    // Create merged chain
    const mergedChainId = `MERGE-${Date.now().toString(36).toUpperCase()}`;
    const mergedChain = await storage.createCustodyChain({
      chainId: mergedChainId,
      sourceFacilityId: input.processLocationId,
      destinationFacilityId: input.destinationFacilityId,
      productType: input.productType,
      totalQuantity,
      remainingQuantity: totalQuantity,
      status: 'active',
      qualityGrade: input.qualityGrade,
      batchNumber: `MERGED-${Date.now().toString(36)}`,
    });

    // Update parent chains to completed
    await Promise.all(
      input.parentChainIds.map(id => 
        storage.updateCustodyChain(id, { 
          status: 'completed',
          remainingQuantity: 0 
        })
      )
    );

    // Record merge event
    await this.recordEvent({
      chainId: mergedChain.id,
      eventType: 'aggregation',
      businessStep: 'processing',
      disposition: 'active',
      quantity: totalQuantity,
      locationId: input.processLocationId,
    });

    // Record mass balance event
    const massBalanceEvent = await storage.createMassBalanceEvent({
      eventType: 'merge',
      parentChainId: null,
      childChainIds: [mergedChain.id],
      inputQuantity: totalQuantity,
      outputQuantity: totalQuantity,
      conversionRate: 1.0,
      wasteQuantity: 0,
      processLocation: input.processLocationId,
      notes: input.notes,
    });

    return {
      parentChains,
      mergedChain,
      massBalanceEvent,
    };
  }

  async transformChain(input: any) {
    // Handle product transformation (e.g., FFB to CPO)
    const sourceChain = await storage.getCustodyChain(input.sourceChainId);
    if (!sourceChain) {
      throw new Error("Source chain not found");
    }

    const outputQuantity = input.inputQuantity * input.conversionRate;
    const wasteQuantity = input.inputQuantity - outputQuantity;

    // Create transformed chain
    const transformedChainId = `TRANS-${Date.now().toString(36).toUpperCase()}`;
    const transformedChain = await storage.createCustodyChain({
      chainId: transformedChainId,
      sourceFacilityId: input.processLocationId,
      destinationFacilityId: input.destinationFacilityId,
      productType: input.outputProductType,
      totalQuantity: outputQuantity,
      remainingQuantity: outputQuantity,
      status: 'active',
      qualityGrade: input.qualityGrade,
      batchNumber: `TRANS-${Date.now().toString(36)}`,
    });

    // Update source chain
    await storage.updateCustodyChain(input.sourceChainId, {
      remainingQuantity: sourceChain.remainingQuantity - input.inputQuantity,
      status: (sourceChain.remainingQuantity - input.inputQuantity) > 0 ? 'active' : 'completed'
    });

    // Record transformation event
    await this.recordEvent({
      chainId: transformedChain.id,
      eventType: 'transformation',
      businessStep: 'processing',
      disposition: 'active',
      quantity: outputQuantity,
      locationId: input.processLocationId,
    });

    // Record mass balance event
    const massBalanceEvent = await storage.createMassBalanceEvent({
      eventType: 'transformation',
      parentChainId: input.sourceChainId,
      childChainIds: [transformedChain.id],
      inputQuantity: input.inputQuantity,
      outputQuantity,
      conversionRate: input.conversionRate,
      wasteQuantity,
      processLocation: input.processLocationId,
      notes: input.notes,
    });

    return {
      sourceChain,
      transformedChain,
      massBalanceEvent,
    };
  }
}

export const chainOfCustodyService = new ChainOfCustodyService();