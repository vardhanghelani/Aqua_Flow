import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { AuthRequest } from '../types';
import * as assignmentService from '../services/assignment.service';
import { logAudit } from '../middleware/audit';

export const assignValidation = [
  body('driverId').notEmpty(),
  body('areaId').notEmpty(),
];

export async function assign(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentService.assignDriverToArea(
      req.body.driverId,
      req.body.areaId,
      req.user!.id,
      req.user!.organizationId!
    );
    await logAudit(req, 'create', 'DriverAreaAssignment', assignment._id.toString(), req.body);
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const assignments = await assignmentService.getAssignmentHistory({
      organizationId: req.user!.organizationId,
      driverId: req.query.driverId as string,
      areaId: req.query.areaId as string,
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: req.query.to ? new Date(req.query.to as string) : undefined,
    });
    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
}

export async function active(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { DriverAreaAssignment } = await import('../models');
    const { Types } = await import('mongoose');
    const assignments = await DriverAreaAssignment.find({
      isActive: true,
      organizationId: new Types.ObjectId(req.user!.organizationId!),
    })
      .populate('driverId', 'name mobile')
      .populate('areaId', 'name')
      .populate('assignedBy', 'name');
    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
}
