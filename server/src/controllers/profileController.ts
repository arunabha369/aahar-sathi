import type { Request, Response } from 'express';
import { findUserById, saveProfile } from '../db/users.ts';
import { ApiError } from '../utils/ApiError.ts';
import { toPublicUser } from '../utils/serialize.ts';
import { currentUserId } from '../middleware/requireAuth.ts';
import { validBody } from '../middleware/validate.ts';
import { calculateTargets } from '../services/nutrition.ts';
import type { ProfileBody } from '../validation/schemas.ts';

export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = await findUserById(currentUserId(req));
  if (!user) throw ApiError.unauthorized();

  res.json({
    profile: user.profile ?? {},
    profileComplete: user.profileComplete,
    // Targets are handy on the settings page before a new plan is generated.
    targets: user.profileComplete ? calculateTargets(user.profile as ProfileBody) : null,
  });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const profile = validBody<ProfileBody>(req);

  const user = await saveProfile(currentUserId(req), profile);
  if (!user) throw ApiError.unauthorized();

  res.json({
    user: toPublicUser(user),
    profile: user.profile,
    targets: calculateTargets(profile),
  });
}
