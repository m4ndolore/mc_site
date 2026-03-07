-- CreateTable
CREATE TABLE "onboarding_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT,
    "areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "journey_stage" TEXT,
    "products" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT,
    "role_assigned" TEXT NOT NULL DEFAULT 'restricted',
    "via_user_id" TEXT,
    "guild_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provisioned_at" TIMESTAMPTZ,

    CONSTRAINT "onboarding_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "onboarding_profiles_email_idx" ON "onboarding_profiles"("email");

-- CreateIndex
CREATE INDEX "onboarding_profiles_via_user_id_idx" ON "onboarding_profiles"("via_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_profiles_guild_user_id_key" ON "onboarding_profiles"("guild_user_id");

-- AddForeignKey
ALTER TABLE "onboarding_profiles" ADD CONSTRAINT "onboarding_profiles_guild_user_id_fkey" FOREIGN KEY ("guild_user_id") REFERENCES "guild_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
