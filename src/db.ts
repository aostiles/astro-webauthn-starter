import { getRuntime } from "@astrojs/cloudflare/runtime";
import type { D1Database } from "@cloudflare/workers-types";
import type { RegistrationParsed } from "@passwordless-id/webauthn/dist/esm/types";

export async function setNonce(request: Request): Promise<string> {
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  const nonce = crypto.randomUUID();
  const expirationTimestamp = Date.now() + 60 * 1000; // Current timestamp + 1 minute
  await SITE_DB.prepare(
    "INSERT INTO nonces (nonce, expiration_timestamp) VALUES (?1, ?2)"
  )
    .bind(nonce, expirationTimestamp)
    .run();
  return nonce;
}

export async function getNonce(
  request: Request,
  nonce: string
): Promise<string> {
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  const expirationTimestamp = Date.now(); // Current timestamp
  const stmt = SITE_DB.prepare(
    "SELECT nonce FROM nonces WHERE nonce = ?1 AND expiration_timestamp > ?2"
  ).bind(nonce, expirationTimestamp);
  const foundNonce: string = await stmt.first("nonce");
  await SITE_DB.prepare("DELETE FROM nonces WHERE nonce = ?1")
    .bind(nonce)
    .run();
  return foundNonce;
}

export async function saveRegistration(
  request: Request,
  reg: RegistrationParsed,
  msg: string
): Promise<void> {
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  const serialized = JSON.stringify(reg.credential);
  await SITE_DB.prepare(
    "INSERT INTO reg_requests (username, message, cred) VALUES (?1, ?2, ?3)"
  )
    .bind(reg.username, msg, serialized)
    .run();
  return;
}

export async function getCreds(
  request: Request,
  username: string
): Promise<string[]> {
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  const query = `
    SELECT json_extract(creds.cred, '$.id') AS cred_id
    FROM creds 
    JOIN users ON creds.user_id = users.id 
    WHERE users.username = ?1;`;
  const stmt = SITE_DB.prepare(query).bind(username);
  const result = await stmt.all();
  if (!result.success) {
    return [];
  }
  if (!result.results) {
    return [];
  }
  let creds: string[] = [];
  result.results.forEach(function (row) {
    // @ts-ignore
    creds.push(row.cred_id);
  });
  return creds;
}

export async function getCred(
  request: Request,
  cred_id: string
): Promise<string> {
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  const query = `
    SELECT cred
    FROM creds
    WHERE json_extract(creds.cred, '$.id') = ?1;`;
  const stmt = SITE_DB.prepare(query).bind(cred_id);
  const result: string = await stmt.first("cred");
  return result;
}

export async function getUser(
  request: Request,
  cred_id: string
): Promise<string> {
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  const query = `
    SELECT username
    FROM users
    JOIN creds ON creds.user_id = users.id
    WHERE json_extract(creds.cred, '$.id') = ?1;`;
  const stmt = SITE_DB.prepare(query).bind(cred_id);
  const username: string = await stmt.first("username");
  return username;
}

export async function createSession(
  request: Request,
  username: string
): Promise<string> {
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  const sid = crypto.randomUUID();
  const query = `
    INSERT INTO sessions (session_id, user_id, expires_at)
    VALUES (
        ?1, 
        (SELECT id FROM users WHERE username = ?2), 
        DATETIME('now', '+24 hours')
    );`;
  await SITE_DB.prepare(query).bind(sid, username).run();
  return sid;
}

export async function userFromSession(
  request: Request,
  sid: string | undefined
): Promise<string | null> {
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  if (!sid) {
    return null;
  }
  const query = `
    SELECT username FROM sessions 
    JOIN users ON sessions.user_id = users.id
    WHERE session_id = ?1 AND expires_at > DATETIME('now')
    `;
  const stmt = SITE_DB.prepare(query).bind(sid);
  const username: string = await stmt.first("username");
  return username;
}

export async function logout(
  request: Request,
  sid: string | undefined
): Promise<void> {
  if (!sid) {
    return; // no user was logged in anyway. Can happen if the client clears cookies.
  }
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  const query = `
    DELETE FROM sessions
    WHERE session_id = ?1;
    `;
  await SITE_DB.prepare(query).bind(sid).run();
  return;
}

export async function getNotes(request: Request): Promise<string[]> {
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  const query = `
    SELECT * FROM notes
    ORDER BY created_at DESC`;
  const stmt = SITE_DB.prepare(query);
  const result = await stmt.all();
  if (!result.success) {
    return [];
  }
  if (!result.results) {
    return [];
  }
  let notes: string[] = [];
  result.results.forEach(function (row) {
    // @ts-ignore
    notes.push(row.content);
  });
  return notes;
}

export async function getMessages(request: Request): Promise<any[]> {
  const runtime = getRuntime(request);
  const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
  const query = `
    SELECT * FROM messages
    ORDER BY time_created DESC`;
  const stmt = SITE_DB.prepare(query);
  const result = await stmt.all();
  if (!result.success) {
    return [];
  }
  if (!result.results) {
    return [];
  }
  return result.results;
}

export async function getFeaturedPosts(request: Request): Promise<any[]> {
    const runtime = getRuntime(request);
    const { SITE_DB } = runtime.env as { SITE_DB: D1Database };
    const query = `
      SELECT * FROM featured_posts
      ORDER BY created_at DESC`;
    const stmt = SITE_DB.prepare(query);
    const result = await stmt.all();
    if (!result.success) {
      return [];
    }
    if (!result.results) {
      return [];
    }
    return result.results;
  }
