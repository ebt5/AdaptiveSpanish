# Adaptive Spanish — Go Live Checklist

## Content & Data
- [ ] Clean up the dictionary (some definitions are strange / incorrect)
- [ ] Expand verb table to 100 regular verbs + substantial irregular set
- [ ] Populate all conjugations for expanded verb set (13 tenses × 6 pronouns)
- [ ] Populate example sentences (ES + EN) for all new conjugations
- [ ] Implement phrases pillar (phrase drilling with bucket system)
- [ ] Add visual image anchors for vocabulary (one image per word)
- [ ] Review and QA example sentences for accuracy and naturalness

## Drilling & Algorithm
- [ ] Enable reverse translation drilling (Spanish → English in addition to English → Spanish)
- [ ] Add phrase drilling mode
- [ ] Apply same adaptive algorithm to phrases as vocab

## Auth & Security
- [ ] Implement password-based authentication
- [ ] Add Google OAuth
- [ ] Secure all API routes (currently unauthenticated)
- [ ] User session management / JWT or similar
- [ ] Rate limiting on drill submission endpoints

## Payments & Pricing
- [ ] Think through pricing model (individual vs school tiers)
- [ ] Integrate payment processor (Stripe recommended)
- [ ] Build subscription management (upgrade, cancel, billing portal)
- [ ] Free tier definition (how much is free before paywall)
- [ ] School/classroom pricing (per-seat annual)

## Classroom / Teacher Features
- [ ] Teacher account type with class management
- [ ] Create/manage class rosters
- [ ] Teacher dashboard: per-student heatmap, time-on-task, progress over time
- [ ] Class-wide weak spot view
- [ ] Ability to assign specific tenses or vocab sets to a class
- [ ] Student join flow (class code or invite link)

## Performance
- [ ] Performance audit (page load, API response times, DB query optimization)
- [ ] Add indexes to frequently queried columns (userId+bucket, userId+conjugationId)
- [ ] Consider caching for static data (conjugations, vocab entries)
- [ ] Optimize Vercel cold starts if needed

## UI / UX
- [ ] General UI clean up and fine tuning
- [ ] Mobile responsiveness pass
- [ ] Additional gamification — celebrations for milestones
- [ ] Dynamic background or visual reward for levels achieved
- [ ] Onboarding flow for new users (what is this, how does it work)
- [ ] Empty state improvements (new user with no data)

## Infrastructure & Ops
- [ ] Set up custom domain
- [ ] Configure Vercel to auto-deploy from GitHub main (currently CLI only)
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Database backups configured
- [ ] Environment variable audit (no secrets in code)
- [ ] HTTPS enforced (Vercel handles this but verify)

## Missing from original list (my additions)
- [ ] Privacy policy and terms of service
- [ ] Email for account recovery / notifications
- [ ] Admin panel for managing content (dictionary, verbs, phrases)
- [ ] Analytics / usage tracking (what are users drilling, drop-off points)
- [ ] Accessibility audit (keyboard navigation, screen reader basics)
- [ ] App Store / PWA consideration for mobile-first feel
