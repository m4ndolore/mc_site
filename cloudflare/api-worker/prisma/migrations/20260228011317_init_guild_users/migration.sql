-- CreateTable
CREATE TABLE "guild_users" (
    "id" UUID NOT NULL,
    "issuer" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guild_users_email_idx" ON "guild_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "guild_users_issuer_subject_key" ON "guild_users"("issuer", "subject");
