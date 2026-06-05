import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'owner' | 'driver';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  driverId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface InventorySnapshot {
  totalCoolersOwned: number;
  warehouseStock: number;
  customerHoldings: number;
  inCirculation: number;
  missingCoolers: number;
  isBalanced: boolean;
}

export type ObjectId = Types.ObjectId;
