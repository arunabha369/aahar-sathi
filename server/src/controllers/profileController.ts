import type { Request, Response } from 'express';
import { findUserById, saveProfile } from '../db/users.js';
import { ApiError } from '../utils/ApiError.js';
import { toPublicUser } from '../utils/serialize.js';
import { currentUserId } from '../middleware/requireAuth.js';
import { validBody } from '../middleware/validate.js';
import { calculateTargets } from '../services/nutrition.js';
import type { ProfileBody } from '../validation/schemas.js';

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
