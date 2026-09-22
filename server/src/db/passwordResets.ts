import { pool, withTransaction } from './pool.ts';

/** Records a new reset link for the user, replacing any earlier unused one. */
export async function createPasswordReset(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await withTransaction(async (client) => {
    await client.query('delete from app.password_resets where user_id = $1 and used_at is null', [userId]);
    await client.query('insert into app.password_resets (token_hash, user_id, expires_at) values ($1, $2, $3)', [
      tokenHash,
      userId,
      expiresAt,
    ]);
  });
}

/** Was a reset link sent to this user in the last `seconds`? (Stops one address being flooded.) */
export async function resetSentRecently(userId: string, seconds: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    `select 1 from app.password_resets where user_id = $1 and created_at > now() - make_interval(secs => $2)`,
    [userId, seconds],
  );
  return (rowCount ?? 0) > 0;
}

/**
 * Uses a reset link: if it is unused and unexpired, sets the new password, marks the link
 * used, drops the user's other links, and stamps password_changed_at so older sessions end.
 * Returns the user's id, or null when the link is not valid. All in one transaction.
 */
export async function consumePasswordReset(tokenHash: string, passwordHash: string): Promise<string | null> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ userId: string }>(
      `select user_id as "userId" from app.password_resets
       where token_hash = $1 and used_at is null and expires_at > now()
       for update`,
      [tokenHash],
    );
    const userId = rows[0]?.userId;
    if (!userId) return null;

    await client.query('update app.users set password_hash = $2, password_changed_at = now() where id = $1', [
      userId,
      passwordHash,
    ]);
    await client.query('update app.password_resets set used_at = now() where token_hash = $1', [tokenHash]);
    await client.query('delete from app.password_resets where user_id = $1 and token_hash <> $2', [userId, tokenHash]);
    return userId;
  });
}
