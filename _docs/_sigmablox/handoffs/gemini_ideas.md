Promoted walkthroughs: Add a “Latest improvements” teaser on the homepage or inside member emails linking to the revamped Cohorts filtering experience to drive repeat visits from tablet/mobile users.
Cohorts insights drip: Publish short cohort-spotlight posts (1–2 per week) highlighting new companies or filters—for example, “Top 5 autonomy startups filtered by TRL”—and push via social + newsletter to create habit loops.
In-app nudges: Introduce lightweight notifications or empty-state prompts (“Save this cohort to Favorites to track updates”) to guide non-admin members toward sticky features (filters, Favorites, notes).
Onboarding metric tracking: Instrument the FAB/filter chips interactions (Amplitude, GA4) to see how many visitors actually complete a filter session; use that data to A/B test button copy or placement.
Surface admin content carefully: For admins, extend the new badge paradigm to other privileged areas (notes, government champion data) so they immediately know when extra insight is visible—helps internal adoption without confusing general users.


Yes—letting trusted members work as Authors can speed up publishing, but do it with a clear permission model and a friction-free login path.

Recommended approach
Use Ghost’s built-in staff roles
Contributor: can write drafts but not publish (requires Editor/Admin review). Ideal for newer writers.
Author: can publish their own posts and edit their own content only.
Editor: can publish and edit other users’ work (use sparingly).
Invite each author from Ghost Admin → Settings → Staff with the appropriate role. They’ll get an email to set a password.
Clarify your workflow
If you want Editors to approve everything, keep most of your writers as Contributors and reserve Author only for people who can self-publish without extra review.
Document expectations (style guide, tagging rules) inside 
_docs
 so authors have a go-to reference.
Avoid the “two-login” pain
Right now, members log into the front-end (SigmaBlox Auth) and staff log into Ghost Admin separately. To reduce friction:
Shared identity provider (best long-term)
Since you already have Authentik/ICAM plans, wire Ghost Admin’s staff login to the same IdP via Ghost’s SSO option (requires Ghost(Pro) + custom SSO or self-hosted reverse proxy). This way authors use the same credentials everywhere.
Single sign-on via custom portal (short term)
Build an internal “Author Console” page in your front-end. When a trusted user clicks “Open Ghost Admin,” call the Admin API to generate a staff session magic link (Ghost supports this) and redirect them—no extra password entry.
At minimum, matching emails + password manager
Ensure the email they use on the front-end is exactly the same as their staff account; provide a saved password/SSO link so the second login is one click.
If you prefer not to expose Ghost Admin directly
Build a simple submission UI on your site that calls the Ghost Admin API with a service integration key. Authors would create drafts there, and Editors/Admins publish via the API or Ghost interface. This also keeps everything under your single sign-on but requires more dev work (forms, media upload, preview).
When it’s not a good idea
If you can’t trust the authors to follow tagging/SEO conventions, or you lack an Editor to review, publishing access can create extra cleanup work. In that case, keep them as Contributors or use the custom submission UI.
Next steps for implementation
Decide roles (Contributor vs Author vs Editor) for each person.
Configure SSO or magic-link flow so staff don’t type credentials twice.
Document publishing standards in 
_docs/handoffs/
 (you already started with 
gemini_ideas.md
—add style/SEO rules).
Instrument author activity (who publishes what) to keep accountability and feed Newsletter/Combine posts._
Done well, this gives you a steady content pipeline without bottlenecking on admin logins, and keeps security tight.