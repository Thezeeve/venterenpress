# Revenue Platform

The revenue layer combines advertising, premium subscriptions, and marketplace-style sponsored listings.

## Data model

- `Advertiser` stores advertiser profiles.
- `AdCampaign` stores budgets, status, impressions, and clicks.
- `AdPlacement` stores placement inventory.
- `MarketplaceListing` stores sponsored reports, press releases, research reports, and data products.

## UI and APIs

- `/dashboard/revenue` shows the revenue command center.
- `/advertise` is the public sponsor and advertiser landing page.
- `/api/rest/revenue/ads` manages campaigns and placements.
- `/api/rest/revenue/marketplace` manages marketplace listings.

## Notes

- Keep the payment-provider abstraction isolated from the campaign system so Stripe or another provider can be swapped without rewriting the business model.
- Revenue dashboards should be read-heavy and cacheable, while checkout and billing actions stay transactional.
