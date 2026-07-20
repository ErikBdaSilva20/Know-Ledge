// Idempotent seed for the tenant-local (Story 7.3). Safe to re-run: every
// insert is keyed on a fixed id with `on conflict do nothing`. To reset from
// scratch, drop the `kv_tenant_local_data` docker volume instead (see
// dev/README.md).
import { pool } from "./db.js";
import { hashPassword } from "./auth.js";

const SEED_PASSWORD = "password123";

const USERS = [
  { id: "seed-admin", name: "Ana Admin", email: "admin@seed.local", role: "admin" },
  { id: "seed-manager", name: "Marco Manager", email: "manager@seed.local", role: "manager" },
  { id: "seed-rep-1", name: "Rita Rep", email: "rep1@seed.local", role: "rep" },
  { id: "seed-rep-2", name: "Rui Rep", email: "rep2@seed.local", role: "rep" },
] as const;

const REP1 = "seed-rep-1";
const REP2 = "seed-rep-2";
const MANAGER = "seed-manager";

const FOLDER_REP1 = "a0000000-0000-4000-8000-000000000001";
const DOC_REP1 = "a0000000-0000-4000-8000-000000000002";
const FOLDER_REP2 = "a0000000-0000-4000-8000-000000000003";
const DOC_REP2 = "a0000000-0000-4000-8000-000000000004";
const SHARED_DOC = "a0000000-0000-4000-8000-000000000005";
const DOC_REFERENCE = "a0000000-0000-4000-8000-000000000006";
const FAVORITE = "a0000000-0000-4000-8000-000000000007";

async function seedUsers() {
  const passwordHash = hashPassword(SEED_PASSWORD);
  for (const u of USERS) {
    await pool.query(
      `insert into "user" (id, name, email, password_hash, role)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do nothing`,
      [u.id, u.name, u.email, passwordHash, u.role],
    );
  }
}

// Two reps with their own folder+document is the minimum needed to exercise
// the cross-owner zero-trust cases from doc/architecture/03-seguranca-zero-trust.md
// (§3 visibility, §4 IDOR): rep1 must never see/touch rep2's document.
async function seedBusinessData() {
  await pool.query(
    `insert into folders (id, owner_id, parent_id, name) values ($1, $2, null, 'Projetos')
     on conflict (id) do nothing`,
    [FOLDER_REP1, REP1],
  );
  await pool.query(
    `insert into documents (id, owner_id, folder_id, title, content)
     values ($1, $2, $3, 'Kickoff Acme', $4)
     on conflict (id) do nothing`,
    [DOC_REP1, REP1, FOLDER_REP1, "# Kickoff Acme\n\nReuniao inicial com o cliente."],
  );

  await pool.query(
    `insert into folders (id, owner_id, parent_id, name) values ($1, $2, null, 'Pesquisa')
     on conflict (id) do nothing`,
    [FOLDER_REP2, REP2],
  );
  await pool.query(
    `insert into documents (id, owner_id, folder_id, title, content)
     values ($1, $2, $3, 'Pesquisa de mercado', $4)
     on conflict (id) do nothing`,
    [DOC_REP2, REP2, FOLDER_REP2, "# Pesquisa\n\nAnalise competitiva do setor."],
  );

  await pool.query(
    `insert into shared_documents (id, title, content, source_document_id, published_by)
     values ($1, 'Processo de Onboarding', $2, $3, $4)
     on conflict (id) do nothing`,
    [SHARED_DOC, "# Onboarding\n\nGuia oficial para novos membros.", DOC_REP1, MANAGER],
  );

  await pool.query(
    `insert into document_references
       (id, owner_id, source_document_id, target_scope, target_document_id)
     values ($1, $2, $3, 'shared', $4)
     on conflict (id) do nothing`,
    [DOC_REFERENCE, REP1, DOC_REP1, SHARED_DOC],
  );

  await pool.query(
    `insert into favorites (id, owner_id, document_scope, document_id)
     values ($1, $2, 'shared', $3)
     on conflict (id) do nothing`,
    [FAVORITE, REP1, SHARED_DOC],
  );
}

async function main() {
  await seedUsers();
  await seedBusinessData();
  console.log("Seed complete. Password for every seed user:", SEED_PASSWORD);
  for (const u of USERS) console.log(`  ${u.role.padEnd(7)} ${u.email}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
