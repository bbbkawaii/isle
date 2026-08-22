-- Cover reverse foreign-key lookups used by matching and activity flows.
CREATE INDEX "Invitation_activityId_idx" ON "public"."Invitation"("activityId");
CREATE INDEX "Like_toUserId_idx" ON "public"."Like"("toUserId");
CREATE INDEX "Match_userBId_idx" ON "public"."Match"("userBId");
