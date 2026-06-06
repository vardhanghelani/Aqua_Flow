import { DriverAreaAssignment, Driver, Area } from '../models';
import { Types } from 'mongoose';
import { ApiError } from '../utils/apiError';

export async function getActiveAssignmentForDriver(driverId: string, organizationId?: string) {
  const query: Record<string, unknown> = {
    driverId: new Types.ObjectId(driverId),
    isActive: true,
  };
  if (organizationId) query.organizationId = new Types.ObjectId(organizationId);
  return DriverAreaAssignment.findOne(query).populate('areaId', 'name');
}

export async function getActiveAssignmentForArea(areaId: string, organizationId?: string) {
  const query: Record<string, unknown> = {
    areaId: new Types.ObjectId(areaId),
    isActive: true,
  };
  if (organizationId) query.organizationId = new Types.ObjectId(organizationId);
  return DriverAreaAssignment.findOne(query).populate('driverId', 'name mobile');
}

export async function assignDriverToArea(
  driverId: string,
  areaId: string,
  assignedBy: string,
  organizationId: string
) {
  const orgId = new Types.ObjectId(organizationId);
  const driver = await Driver.findOne({ _id: driverId, organizationId: orgId });
  if (!driver || !driver.isActive) throw new ApiError(404, 'Driver not found or inactive');

  const area = await Area.findOne({ _id: areaId, organizationId: orgId });
  if (!area) throw new ApiError(404, 'Area not found');

  const now = new Date();

  await DriverAreaAssignment.updateMany(
    {
      organizationId: orgId,
      $or: [
        { areaId: new Types.ObjectId(areaId), isActive: true },
        { driverId: new Types.ObjectId(driverId), isActive: true },
      ],
    },
    { isActive: false, endDate: now, updatedBy: new Types.ObjectId(assignedBy) }
  );

  const assignment = await DriverAreaAssignment.create({
    organizationId: orgId,
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
  organizationId?: string;
  driverId?: string;
  areaId?: string;
  from?: Date;
  to?: Date;
}) {
  const query: Record<string, unknown> = {};
  if (filters.organizationId) query.organizationId = new Types.ObjectId(filters.organizationId);
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
