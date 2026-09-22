import type { Request, Response } from 'express';
import * as household from '../db/household.ts';
import { findUserById } from '../db/users.ts';
import { currentUserId } from '../middleware/requireAuth.ts';
import { validBody, validParams } from '../middleware/validate.ts';
import { calculateTargets } from '../services/nutrition.ts';
import { strictestDiet } from '../services/household.ts';
import { ApiError } from '../utils/ApiError.ts';
import type { MemberProfile, Profile } from '../types.ts';
import type { IdParams, MemberBody } from '../validation/schemas.ts';

function toMember({ name, ...profile }: MemberBody): Omit<household.HouseholdMember, 'id'> {
  const memberProfile: MemberProfile = { ...profile, jain: profile.jain ?? false };
  return { name, profile: memberProfile };
}

/** Members with their own daily targets, and what the shared menu will be. */
async function householdView(userId: string) {
  const [members, user] = await Promise.all([household.listMembers(userId), findUserById(userId)]);
  const owner = user?.profileComplete ? (user.profile as Profile) : null;
  return {
    members: members.map((member) => ({
      ...member,
      targets: calculateTargets({ ...member.profile, cuisine: owner?.cuisine ?? 'mix' }),
    })),
    sharedDiet: owner ? strictestDiet([owner.diet, ...members.map((member) => member.profile.diet)]) : null,
    anyJain: members.some((member) => member.profile.jain),
    maxMembers: household.MAX_HOUSEHOLD_MEMBERS,
  };
}

export async function listHousehold(req: Request, res: Response): Promise<void> {
  res.json(await householdView(currentUserId(req)));
}

export async function addMember(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const member = await household.insertMember(userId, toMember(validBody<MemberBody>(req)));
  if (!member) {
    throw ApiError.badRequest(`A household can have up to ${household.MAX_HOUSEHOLD_MEMBERS} other people.`);
  }
  res.status(201).json(await householdView(userId));
}

export async function editMember(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const userId = currentUserId(req);
  if (!(await household.updateMember(userId, id, toMember(validBody<MemberBody>(req))))) {
    throw ApiError.notFound('That person is not in your household.');
  }
  res.json(await householdView(userId));
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  const { id } = validParams<IdParams>(req);
  const userId = currentUserId(req);
  if (!(await household.deleteMember(userId, id))) throw ApiError.notFound('That person is not in your household.');
  res.json(await householdView(userId));
}
