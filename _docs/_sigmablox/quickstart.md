Deployment Workflow (Now Simplified)

  Primary Method:
  ./deploy.sh [environment] [options]

  # Examples:
  ./deploy.sh staging                    #
  Deploy all to staging
  ./deploy.sh production --ghost-only    #
  Theme only to prod
  ./deploy.sh staging --webhook-only     # API
  only to staging
  ./deploy.sh production --dry-run       # Test
   without deploying

  Specialized Scripts (when needed):
  - Theme deployments: Use
  ghost-cloudrun/deploy-*.sh
  - Webhook deployments: Use
  webhook/deploy-*.sh

  ---
  Next Recommended Steps (From Migration Guide)

  Based on the CI/CD recommendations in your
  migration guide, here are the immediate next
  actions:

  Week 1: Automation (3-4 hours)
  1. Git-based theme deployment - Initialize
  git in theme directory on VM, enable git pull
   deploys
  2. Automated backups - Set up cron job
  backing up to Google Cloud Storage (2 AM
  daily)
  3. Smoke tests - Add health checks to
  deployment script

  Week 2: Blue-Green Setup (2-3 hours)
  1. Rebuild ghost-vm as staging - Use old prod
   VM per migration guide Phase 4
  2. Test instant switchover - Cloudflare
  tunnel switching for zero-downtime deploys

  ---
  Git Status

  Ready to commit these changes:
  - 2 files modified (README files)
  - 25+ files deleted (archives, outdated docs,
   redundant scripts)
  - 2 files added (FEATURE_DIFFERENCES.md, new
  _docs/README.md)

  ---
  Questions for You

  1. Commit message: What should I use?
  Suggestion:
  Aggressive project cleanup: reduce scripts,
  consolidate docs

  - Delete 144KB of archives and 63 redundant
  deployment scripts
  - Remove outdated Next.js documentation
  (doesn't match Ghost CMS reality)
  - Create FEATURE_DIFFERENCES.md analyzing doc
   vs implementation
  - Update README with simplified, accurate
  workflow
  - Consolidate to 6 essential deployment
  scripts

  Result: 91% reduction in deployment scripts,
  clear documentation
  2. Authentik: I see Authentik integration
  docs but it's not mentioned in the migration
  guide. Is this deployed/active, or should
  those docs be archived too?
  3. Next steps: Should I proceed with
  implementing the CI/CD improvements
  (git-based theme deployment, automated
  backups)?

  The project is now significantly lighter and
  clearer. Ready to ship features fast! 🚀