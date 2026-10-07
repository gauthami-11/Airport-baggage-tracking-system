import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.ts';
import {
  getBaggageByTag,
  getAllBaggage,
  getDashboardStatistics,
  getPassengerDashboard
} from '../services/baggageService.ts';

export async function getBaggageByTagHandler(req: Request, res: Response) {
  try {
    const { tagNumber } = req.params;
    if (!tagNumber) {
      return res.status(400).json({ message: 'Please enter a baggage tag number.' });
    }

    const baggage = await getBaggageByTag(tagNumber);
    if (!baggage) {
      return res.status(404).json({ message: 'No baggage found for this tag number.' });
    }

    return res.status(200).json(baggage);
  } catch (error: any) {
    console.error('Error fetching baggage:', error);
    return res.status(500).json({ message: 'Unable to retrieve baggage information. Please try again.' });
  }
}

export async function getAllBaggageHandler(req: Request, res: Response) {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;

    const baggageList = await getAllBaggage({ status, search });
    return res.status(200).json(baggageList);
  } catch (error: any) {
    console.error('Error listing baggage:', error);
    return res.status(500).json({ message: 'Failed to retrieve baggage records.' });
  }
}

export async function getStatisticsHandler(req: Request, res: Response) {
  try {
    const stats = await getDashboardStatistics();
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error calculating statistics:', error);
    return res.status(500).json({ message: 'Failed to calculate operations statistics.' });
  }
}

export async function getPassengerDashboardHandler(req: AuthRequest, res: Response) {
  try {
    // If authenticated as passenger, use user id; default to id 2 (demo passenger) if testing without token
    const passengerId = req.user?.id || 2;
    const data = await getPassengerDashboard(passengerId);
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error retrieving passenger dashboard:', error);
    return res.status(500).json({ message: 'Failed to load passenger dashboard.' });
  }
}
