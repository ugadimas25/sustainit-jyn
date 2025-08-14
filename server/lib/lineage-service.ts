import { storage } from "../storage";

interface LineageNode {
  id: string;
  type: string;
  name: string;
  data: any;
  coordinates?: { latitude: number; longitude: number };
  riskLevel?: string;
  certifications?: string[];
  distance?: number;
}

interface LineageEdge {
  source: string;
  target: string;
  type: string;
  quantity?: number;
  date?: Date;
  metadata?: any;
}

class LineageService {
  async traceForward(entityId: string, entityType: string) {
    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];
    const visited = new Set<string>();

    await this._traceForwardRecursive(entityId, entityType, nodes, edges, visited, 0);

    return {
      entityId,
      entityType,
      depth: Math.max(...nodes.map(n => (n.data.level || 0))),
      totalNodes: nodes.length,
      nodes,
      edges,
      riskAssessment: await this._assessRisk(nodes),
    };
  }

  async traceBackward(entityId: string, entityType: string) {
    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];
    const visited = new Set<string>();

    await this._traceBackwardRecursive(entityId, entityType, nodes, edges, visited, 0);

    return {
      entityId,
      entityType,
      depth: Math.max(...nodes.map(n => (n.data.level || 0))),
      totalNodes: nodes.length,
      nodes,
      edges,
      riskAssessment: await this._assessRisk(nodes),
    };
  }

  async getFullLineage(entityId: string, entityType: string) {
    const forwardTrace = await this.traceForward(entityId, entityType);
    const backwardTrace = await this.traceBackward(entityId, entityType);

    // Merge nodes and edges, avoiding duplicates
    const allNodes = new Map<string, LineageNode>();
    const allEdges = new Map<string, LineageEdge>();

    // Add forward trace nodes
    forwardTrace.nodes.forEach(node => allNodes.set(node.id, node));
    forwardTrace.edges.forEach(edge => 
      allEdges.set(`${edge.source}-${edge.target}`, edge)
    );

    // Add backward trace nodes
    backwardTrace.nodes.forEach(node => allNodes.set(node.id, node));
    backwardTrace.edges.forEach(edge => 
      allEdges.set(`${edge.source}-${edge.target}`, edge)
    );

    return {
      entityId,
      entityType,
      depth: Math.max(forwardTrace.depth, backwardTrace.depth),
      totalNodes: allNodes.size,
      nodes: Array.from(allNodes.values()),
      edges: Array.from(allEdges.values()),
      riskAssessment: await this._assessRisk(Array.from(allNodes.values())),
    };
  }

  private async _traceForwardRecursive(
    entityId: string, 
    entityType: string, 
    nodes: LineageNode[], 
    edges: LineageEdge[], 
    visited: Set<string>, 
    level: number
  ) {
    const nodeKey = `${entityType}:${entityId}`;
    if (visited.has(nodeKey)) return;
    visited.add(nodeKey);

    // Get entity data based on type
    const entityData = await this._getEntityData(entityId, entityType);
    if (!entityData) return;

    // Add node
    nodes.push({
      id: entityId,
      type: entityType,
      name: entityData.name,
      data: { ...entityData, level },
      coordinates: entityData.coordinates,
      riskLevel: entityData.riskLevel || 'unknown',
      certifications: entityData.certifications || [],
    });

    // Find forward connections based on entity type
    const connections = await this._getForwardConnections(entityId, entityType);
    
    for (const connection of connections) {
      edges.push({
        source: entityId,
        target: connection.targetId,
        type: connection.connectionType,
        quantity: connection.quantity,
        date: connection.date,
        metadata: connection.metadata,
      });

      await this._traceForwardRecursive(
        connection.targetId, 
        connection.targetType, 
        nodes, 
        edges, 
        visited, 
        level + 1
      );
    }
  }

  private async _traceBackwardRecursive(
    entityId: string, 
    entityType: string, 
    nodes: LineageNode[], 
    edges: LineageEdge[], 
    visited: Set<string>, 
    level: number
  ) {
    const nodeKey = `${entityType}:${entityId}`;
    if (visited.has(nodeKey)) return;
    visited.add(nodeKey);

    // Get entity data based on type
    const entityData = await this._getEntityData(entityId, entityType);
    if (!entityData) return;

    // Add node
    nodes.push({
      id: entityId,
      type: entityType,
      name: entityData.name,
      data: { ...entityData, level },
      coordinates: entityData.coordinates,
      riskLevel: entityData.riskLevel || 'unknown',
      certifications: entityData.certifications || [],
    });

    // Find backward connections based on entity type
    const connections = await this._getBackwardConnections(entityId, entityType);
    
    for (const connection of connections) {
      edges.push({
        source: connection.sourceId,
        target: entityId,
        type: connection.connectionType,
        quantity: connection.quantity,
        date: connection.date,
        metadata: connection.metadata,
      });

      await this._traceBackwardRecursive(
        connection.sourceId, 
        connection.sourceType, 
        nodes, 
        edges, 
        visited, 
        level + 1
      );
    }
  }

  private async _getEntityData(entityId: string, entityType: string) {
    switch (entityType) {
      case 'plot':
        return await storage.getPlot(entityId);
      case 'facility':
        return await storage.getFacility(entityId);
      case 'custody_chain':
        return await storage.getCustodyChain(entityId);
      case 'production_lot':
        return await storage.getProductionLot(entityId);
      case 'shipment':
        return await storage.getShipment(entityId);
      case 'supplier':
        return await storage.getSupplier(entityId);
      default:
        return null;
    }
  }

  private async _getForwardConnections(entityId: string, entityType: string) {
    const connections: any[] = [];

    switch (entityType) {
      case 'plot':
        // Plot -> Deliveries -> Production Lots
        const deliveries = await storage.getDeliveriesByPlot(entityId);
        for (const delivery of deliveries) {
          connections.push({
            targetId: delivery.id,
            targetType: 'delivery',
            connectionType: 'harvest_delivery',
            quantity: parseFloat(delivery.weight),
            date: delivery.deliveryDate,
            metadata: { quality: delivery.quality, batchNumber: delivery.batchNumber }
          });
        }
        break;

      case 'delivery':
        // Delivery -> Production Lots
        const lotDeliveries = await storage.getLotDeliveriesByDelivery(entityId);
        for (const lotDelivery of lotDeliveries) {
          connections.push({
            targetId: lotDelivery.lotId,
            targetType: 'production_lot',
            connectionType: 'production_input',
            quantity: null,
            date: null,
            metadata: lotDelivery
          });
        }
        break;

      case 'production_lot':
        // Production Lot -> Shipments
        const shipmentLots = await storage.getShipmentLotsByLot(entityId);
        for (const shipmentLot of shipmentLots) {
          connections.push({
            targetId: shipmentLot.shipmentId,
            targetType: 'shipment',
            connectionType: 'export_shipment',
            quantity: parseFloat(shipmentLot.weight),
            date: null,
            metadata: shipmentLot
          });
        }
        break;

      case 'custody_chain':
        // Custody Chain -> Mass Balance Events -> Child Chains
        const massBalanceEvents = await storage.getMassBalanceEventsByParentChain(entityId);
        for (const event of massBalanceEvents) {
          if (event.childChainIds) {
            for (const childId of event.childChainIds) {
              connections.push({
                targetId: childId,
                targetType: 'custody_chain',
                connectionType: event.eventType,
                quantity: parseFloat(event.outputQuantity),
                date: event.processDate,
                metadata: event
              });
            }
          }
        }
        break;
    }

    return connections;
  }

  private async _getBackwardConnections(entityId: string, entityType: string) {
    const connections: any[] = [];

    switch (entityType) {
      case 'shipment':
        // Shipment -> Production Lots
        const shipmentLots = await storage.getShipmentLotsByShipment(entityId);
        for (const shipmentLot of shipmentLots) {
          connections.push({
            sourceId: shipmentLot.lotId,
            sourceType: 'production_lot',
            connectionType: 'export_source',
            quantity: parseFloat(shipmentLot.weight),
            date: null,
            metadata: shipmentLot
          });
        }
        break;

      case 'production_lot':
        // Production Lot -> Deliveries
        const lotDeliveries = await storage.getLotDeliveriesByLot(entityId);
        for (const lotDelivery of lotDeliveries) {
          connections.push({
            sourceId: lotDelivery.deliveryId,
            sourceType: 'delivery',
            connectionType: 'production_input',
            quantity: null,
            date: null,
            metadata: lotDelivery
          });
        }
        break;

      case 'delivery':
        // Delivery -> Plot
        const delivery = await storage.getDelivery(entityId);
        if (delivery && delivery.plotId) {
          connections.push({
            sourceId: delivery.plotId,
            sourceType: 'plot',
            connectionType: 'harvest_source',
            quantity: parseFloat(delivery.weight),
            date: delivery.deliveryDate,
            metadata: delivery
          });
        }
        break;

      case 'custody_chain':
        // Custody Chain -> Parent Chains (through mass balance events)
        const childEvents = await storage.getMassBalanceEventsByChildChain(entityId);
        for (const event of childEvents) {
          if (event.parentChainId) {
            connections.push({
              sourceId: event.parentChainId,
              sourceType: 'custody_chain',
              connectionType: event.eventType,
              quantity: parseFloat(event.inputQuantity),
              date: event.processDate,
              metadata: event
            });
          }
        }
        break;
    }

    return connections;
  }

  private async _assessRisk(nodes: LineageNode[]) {
    const riskFactors: any[] = [];
    let overallRisk = 'low';
    
    // Analyze risk factors across all nodes
    for (const node of nodes) {
      if (node.riskLevel === 'high' || node.riskLevel === 'critical') {
        riskFactors.push({
          type: 'high_risk_entity',
          severity: node.riskLevel,
          description: `${node.type} ${node.name} has ${node.riskLevel} risk level`,
          entityId: node.id,
        });
        if (node.riskLevel === 'critical') overallRisk = 'critical';
        else if (overallRisk !== 'critical') overallRisk = 'high';
      }

      // Check for deforestation alerts (if plot)
      if (node.type === 'plot' && node.data.deforestationRisk !== 'low') {
        riskFactors.push({
          type: 'deforestation_risk',
          severity: node.data.deforestationRisk,
          description: `Plot ${node.name} has ${node.data.deforestationRisk} deforestation risk`,
          entityId: node.id,
        });
      }

      // Check for legal status issues
      if (node.data.legalityStatus === 'issues') {
        riskFactors.push({
          type: 'legality_issue',
          severity: 'high',
          description: `Legal compliance issues detected for ${node.name}`,
          entityId: node.id,
        });
        if (overallRisk !== 'critical') overallRisk = 'high';
      }
    }

    // Determine compliance status
    const eudrCompliant = !riskFactors.some(rf => 
      rf.type === 'deforestation_risk' || rf.type === 'legality_issue'
    );
    
    const rspoCompliant = nodes.some(node => 
      node.certifications?.includes('RSPO')
    );

    return {
      overallRisk,
      riskFactors,
      compliance: {
        eudrCompliant,
        rspoCompliant,
        issues: riskFactors.map(rf => rf.description),
      },
    };
  }

  async generateReport(input: any) {
    let lineageData;
    
    switch (input.reportType) {
      case 'forward_trace':
        lineageData = await this.traceForward(input.targetEntityId, input.targetEntityType);
        break;
      case 'backward_trace':
        lineageData = await this.traceBackward(input.targetEntityId, input.targetEntityType);
        break;
      case 'full_lineage':
        lineageData = await this.getFullLineage(input.targetEntityId, input.targetEntityType);
        break;
      default:
        throw new Error('Invalid report type');
    }

    const reportId = `LIN-${Date.now().toString(36).toUpperCase()}`;
    
    const report = await storage.createLineageReport({
      reportId,
      reportType: input.reportType,
      targetEntityId: input.targetEntityId,
      targetEntityType: input.targetEntityType,
      lineageData,
      generationParameters: input.filters || {},
      totalNodes: lineageData.totalNodes,
      totalLevels: lineageData.depth,
      exportFormat: input.exportFormat || 'json',
      status: 'completed',
    });

    return {
      ...report,
      exportUrl: `/api/lineage-reports/${report.id}/export`,
    };
  }
}

export const lineageService = new LineageService();