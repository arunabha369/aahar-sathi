import { pool } from './pool.ts';
import type { MemberProfile } from '../types.ts';

export interface HouseholdMember {
  id: string;
  name: string;
  profile: MemberProfile;
}

/** Enough for a joint family; more than this and one shared menu stops making sense. */
export const MAX_HOUSEHOLD_MEMBERS = 8;

const COLUMNS = 'id, name, profile';

export async function listMembers(userId: string): Promise<HouseholdMember[]> {
  const { rows } = await pool.query<HouseholdMember>(
    `select ${COLUMNS} from app.household_members where user_id = $1 order by created_at, id`,
    [userId],
  );
  return rows;
}

/** Adds a member unless the household is full; null when it is. */
export async function insertMember(
  userId: string,
  member: Omit<HouseholdMember, 'id'>,
): Promise<HouseholdMember | null> {
  const { rows } = await pool.query<HouseholdMember>(
    `insert into app.household_members (user_id, name, profile)
     select $1, $2, $3::jsonb
     where (select count(*) from app.household_members where user_id = $1) < $4
     returning ${COLUMNS}`,
    [userId, member.name, JSON.stringify(member.profile), MAX_HOUSEHOLD_MEMBERS],
  );
  return rows[0] ?? null;
}

export async function updateMember(
  userId: string,
  id: string,
  member: Omit<HouseholdMember, 'id'>,
): Promise<HouseholdMember | null> {
  const { rows } = await pool.query<HouseholdMember>(
    `update app.household_members set name = $3, profile = $4::jsonb
     where user_id = $1 and id = $2 returning ${COLUMNS}`,
    [userId, id, member.name, JSON.stringify(member.profile)],
  );
  return rows[0] ?? null;
}

export async function deleteMember(userId: string, id: string): Promise<boolean> {
  const { rowCount } = await pool.query('delete from app.household_members where user_id = $1 and id = $2', [
    userId,
    id,
  ]);
  return rowCount === 1;
}

export async function deleteMembersForUser(userId: string): Promise<void> {
  await pool.query('delete from app.household_members where user_id = $1', [userId]);
}
