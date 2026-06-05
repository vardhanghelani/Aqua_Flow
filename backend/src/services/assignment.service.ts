import { DriverAreaAssignment, Driver } from '../models';
import { Types } from 'mongoose';
import { ApiError } from '../utils/apiError';

export async function getActiveAssignmentForDriver(driverId: string) {
  return DriverAreaAssignment.findOne({
    driverId: new Types.ObjectId(driverId),
    isActive: true,
  }).populate('areaId', 'name');
}

export async function getActiveAssignmentForArea(areaId: string) {
  return DriverAreaAssignment.findOne({
    areaId: new Types.ObjectId(areaId),
    isActive: true,
  }).populate('driverId', 'name mobile');
}

export async function assignDriverToArea(
  driverId: string,
  areaId: string,
  assignedBy: string
) {
  const driver = await Driver.findById(driverId);
  if (!driver || !driver.isActive) throw new ApiError(404, 'Driver not found or inactive');

  const now = new Date();

  await DriverAreaAssignment.updateMany(
    {
      $or: [
        { areaId: new Types.ObjectId(areaId), isActive: true },
        { driverId: new Types.ObjectId(driverId), isActive: true },
      ],
    },
    { isActive: false, endDate: now, updatedBy: new Types.ObjectId(assignedBy) }
  );

  const assignment = await DriverAreaAssignment.create({
    driverId: new Types.ObjectId(driverId),
    areaId: new Types.ObjectId(areaId),
    assignedBy: new Types.ObjectId(assignedBy),
    startDate: now,
    isActive: true,
    createdBy: new Types.ObjectId(assignedBy),
  });

  return assignment.populate(['driverId', 'areaId', 'assignedBy']);
}

export async function getAssignmentHistory(filters: {
  driverId?: string;
  areaId?: string;
  from?: Date;
  to?: Date;
}) {
  const query: Record<string, unknown> = {};
  if (filters.driverId) query.driverId = new Types.ObjectId(filters.driverId);
  if (filters.areaId) query.areaId = new Types.ObjectId(filters.areaId);
  if (filters.from || filters.to) {
    query.startDate = {};
    if (filters.from) (query.startDate as Record<string, Date>).$gte = filters.from;
    if (filters.to) (query.startDate as Record<string, Date>).$lte = filters.to;
  }

  return DriverAreaAssignment.find(query)
    .populate('driverId', 'name mobile')
    .populate('areaId', 'name')
    .populate('assignedBy', 'name')
    .sort({ startDate: -1 });
}
