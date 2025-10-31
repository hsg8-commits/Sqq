import { NextRequest } from 'next/server';

export interface Admin {
  _id: string;
  username: string;
  email: string;
  role: string;
  permissions: any;
  isActive: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  avatar?: string;
  lastLogin?: Date;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  save: () => Promise<void>;
}

export function authenticate(req: NextRequest): Promise<Admin>;

export function authorize(resource: string, action: string): (req: NextRequest) => Promise<boolean>;

export function logAdminAction(
  adminId: string | null,
  action: string,
  target?: string | null,
  targetType?: string | null,
  details?: Record<string, any>,
  success?: boolean,
  errorMessage?: string | null,
  req?: NextRequest | null
): Promise<void>;

export function getClientIP(req: NextRequest): string;

export function rateLimit(maxRequests?: number, windowMs?: number): (req: NextRequest) => boolean;

export function validateInput(schema: Record<string, any>): (data: Record<string, any>) => boolean;

export function withErrorHandling(handler: (req: NextRequest, res?: any) => Promise<any>): (req: NextRequest, res?: any) => Promise<any>;
