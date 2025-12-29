# Cloudflare Routing (Merge Combinator)

## Overview
This repo assumes `mergecombinator.com` is served by Cloudflare Pages and a Worker handles path routing to external projects.

## Worker setup
1. Create a Worker and upload `cloudflare/merge-router.js`.
2. Bind the Worker to route `mergecombinator.com/*` (and `www.mergecombinator.com/*` if used).
3. Update the `ROUTES` map as projects move or go live.

## Current path map
- `/combine` -> `https://www.sigmablox.com`
- `/builders` -> `https://www.defensebuilders.com` (update when live)
- `/opportunities` -> `https://sbir.mergecombinator.com`
- `/knowledge` -> `https://irregularpedia.org`
- `/merch` -> `https://merge-combinator-shop.fourthwall.com`

## Pages headers/redirects
- `_headers` provides long-lived asset caching and no-cache HTML.
- `_redirects` provides clean URLs for `/about`, `/blog`, and `/portfolio`.
