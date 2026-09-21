import { pool, type Queryable } from './pool.ts';
import type { Profile } from '../types.ts';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  profile: Partial<Profile>;
  profileComplete: boolean;
  createdAt: Date;
}

// password_hash is deliberately absent: only findUserWithPasswordByEmail ever reads it.
const USER_COLUMNS = `id, name, email, profile, profile_complete as "profileComplete", created_at as "createdAt"`;

export async function findUserById(id: string, db: Queryable = pool): Promise<UserRecord | null> {
  const { rows } = await db.query<UserRecord>(`select ${USER_COLUMNS} from app.users where id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { rows } = await pool.query<UserRecord>(`select ${USER_COLUMNS} from app.users where email = $1`, [
    email.toLowerCase(),
  ]);
  return rows[0] ?? null;
}

export async function findUserWithPasswordByEmail(
  email: string,
): Promise<(UserRecord & { passwordHash: string }) | null> {
  const { rows } = await pool.query<UserRecord & { passwordHash: string }>(
    `select ${USER_COLUMNS}, password_hash as "passwordHash" from app.users where email = $1`,
    [email.toLowerCase()],
  );
  return rows[0] ?? null;
}

export async function userExists(id: string): Promise<boolean> {
  const { rowCount } = await pool.query('select 1 from app.users where id = $1', [id]);
  return rowCount === 1;
}

export async function createUser(input: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
  const { rows } = await pool.query<UserRecord>(
    `insert into app.users (name, email, password_hash) values ($1, $2, $3) returning ${USER_COLUMNS}`,
    [input.name.trim(), input.email.toLowerCase(), input.passwordHash],
  );
  return rows[0]!;
}

/** Creates the account or refreshes it in place, keeping its id (used for the demo user). */
export async function upsertUserByEmail(input: {
  name: string;
  email: string;
  passwordHash: string;
  profile: Profile;
}): Promise<UserRecord> {
  const { rows } = await pool.query<UserRecord>(
    `insert into app.users (name, email, password_hash, profile, profile_complete)
     values ($1, $2, $3, $4::jsonb, true)
     on conflict (email) do update set
       name = excluded.name,
       password_hash = excluded.password_hash,
       profile = excluded.profile,
       profile_complete = true
     returning ${USER_COLUMNS}`,
    [input.name, input.email.toLowerCase(), input.passwordHash, JSON.stringify(input.profile)],
  );
  return rows[0]!;
}

export async function saveProfile(id: string, profile: Profile): Promise<UserRecord | null> {
  const { rows } = await pool.query<UserRecord>(
    `update app.users set profile = $2::jsonb, profile_complete = true where id = $1 returning ${USER_COLUMNS}`,
    [id, JSON.stringify(profile)],
  );
  return rows[0] ?? null;
}

/** Plans and logs go with it: every child table cascades on delete. */
export async function deleteUser(id: string): Promise<void> {
  await pool.query('delete from app.users where id = $1', [id]);
}
