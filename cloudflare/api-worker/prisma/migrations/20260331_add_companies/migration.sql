-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legacy_airtable_id" TEXT,
    "name" TEXT NOT NULL,
    "product_name" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "cf_image_id" TEXT,
    "location" TEXT,
    "description" TEXT,
    "mission_area" TEXT,
    "warfare_domain" TEXT,
    "technology_area" TEXT,
    "product_type" TEXT,
    "trl_level" INTEGER,
    "technical_maturity" TEXT,
    "funding_stage" TEXT,
    "team_size" TEXT,
    "pipeline_stage" TEXT NOT NULL DEFAULT 'applicant',
    "ctas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cohort" TEXT,
    "cohort_id" TEXT,
    "cohort_label" TEXT,
    "tulsa_attended" TEXT,
    "combine_standout" TEXT,
    "badge_judges" TEXT,
    "pod_ranking" INTEGER,
    "upvote_count" INTEGER NOT NULL DEFAULT 0,
    "synopsis_sections" JSONB,
    "synopsis_raw" TEXT,
    "competition_scores" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_pipeline_stage_idx" ON "companies"("pipeline_stage");

-- CreateIndex
CREATE INDEX "companies_mission_area_idx" ON "companies"("mission_area");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");
