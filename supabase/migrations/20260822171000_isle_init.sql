-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sceneNo" INTEGER NOT NULL,
    "optionId" INTEGER NOT NULL,
    "decisionMs" INTEGER NOT NULL,
    "freeText" TEXT,

    CONSTRAINT "SceneAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "vector" TEXT NOT NULL,
    "loveProfile" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "nickname" TEXT,
    "avatar" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "gender" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "education" TEXT NOT NULL,
    "height" INTEGER,
    "intent" TEXT,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "cityScope" TEXT NOT NULL DEFAULT 'same_city',
    "eduReq" TEXT NOT NULL DEFAULT 'none',
    "heightMin" INTEGER,
    "heightMax" INTEGER,
    "intentMatch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "narrative" TEXT NOT NULL,
    "fogContrast" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaneAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameKey" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VaneAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "timeDesc" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "icebreak" TEXT NOT NULL,
    "fitTags" TEXT NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "activityId" INTEGER NOT NULL,
    "inviteText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "counterReason" TEXT,
    "round" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SceneAnswer_sessionId_sceneNo_key" ON "SceneAnswer"("sessionId", "sceneNo");

-- CreateIndex
CREATE UNIQUE INDEX "Report_sessionId_key" ON "Report"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_sessionId_key" ON "User"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Like_fromUserId_toUserId_key" ON "Like"("fromUserId", "toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_userAId_userBId_key" ON "Match"("userAId", "userBId");

-- CreateIndex
CREATE UNIQUE INDEX "VaneAnswer_userId_gameKey_nodeId_key" ON "VaneAnswer"("userId", "gameKey", "nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_matchId_key" ON "Invitation"("matchId");

-- AddForeignKey
ALTER TABLE "SceneAnswer" ADD CONSTRAINT "SceneAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaneAnswer" ADD CONSTRAINT "VaneAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The application reaches Postgres only from trusted server-side Next.js routes.
-- Keep the Data API closed to anonymous and authenticated roles.
ALTER TABLE "GameSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SceneAnswer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VaneAnswer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

