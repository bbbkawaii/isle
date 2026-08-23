-- Align Postgres with the account-first onboarding introduced in 77c622e.
-- Existing populated rows remain unchanged; newly created accounts can finish
-- their island profile later through /api/register.
ALTER TABLE "public"."User"
  ALTER COLUMN "gender" DROP NOT NULL,
  ALTER COLUMN "birthYear" DROP NOT NULL,
  ALTER COLUMN "city" DROP NOT NULL,
  ALTER COLUMN "education" DROP NOT NULL;
