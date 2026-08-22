-- Isle uses Prisma from Vercel server routes, never the public Supabase Data API.
-- These policies make the existing default-deny RLS posture explicit for browser roles.
CREATE POLICY "deny_public_api_access" ON "public"."Activity" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_public_api_access" ON "public"."GameSession" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_public_api_access" ON "public"."Invitation" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_public_api_access" ON "public"."Like" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_public_api_access" ON "public"."Match" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_public_api_access" ON "public"."Report" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_public_api_access" ON "public"."SceneAnswer" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_public_api_access" ON "public"."User" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_public_api_access" ON "public"."VaneAnswer" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
