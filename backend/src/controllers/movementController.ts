import { Request, Response } from 'express';
import { getMovementsByTag, addMovementWithStatusUpdate } from '../services/movementService.ts';
import { BaggageStatus } from '../types/index.ts';

export async function getMovementsHandler(req: Request, res: Response) {
  try {
    const { tagNumber } = req.params;
    if (!tagNumber) {
      return res.status(400).json({ message: 'Please enter a baggage tag number.' });
    }

    const movements = await getMovementsByTag(tagNumber);
    return res.status(200).json(movements);
  } catch (error: any) {
    console.error('Error fetching movements:', error);
    return res.status(500).json({ message: 'Failed to retrieve baggage movement history.' });
  }
}

export async function addMovementHandler(req: Request, res: Response) {
  try {
    const { tagNumber } = req.params;
    const { status, location, remarks } = req.body;

    if (!tagNumber) {
      return res.status(400).json({ message: 'Baggage tag number is required.' });
    }

    if (!status) {
      return res.status(400).json({ message: 'New status is required.' });
    }

    if (!location) {
      return res.status(400).json({ message: 'Location is required.' });
    }

    const result = await addMovementWithStatusUpdate(
      tagNumber,
      status as BaggageStatus,
      location,
      remarks || ''
    );

    return res.status(200).json({
      message: 'Baggage status updated successfully.',
      baggage: result.baggage,
      movement: result.movement
    });
  } catch (error: any) {
    console.error('Error updating baggage movement:', error);
    const statusCode = error.message.includes('No baggage found') ? 404 : 400;
    return res.status(statusCode).json({ message: error.message || 'Failed to update baggage status.' });
  }
}
