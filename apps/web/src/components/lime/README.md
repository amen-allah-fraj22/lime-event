# LIME UI (from Stitch)

Stitch exported **HTML** screens in:

`stitch_lime_event/stitch_lime_event_marketplace_ui/`

These were converted to React in this app using the same colors and layout from `DESIGN.md`:

| Stitch folder | App route |
|---------------|-----------|
| login_signup | `/sign-in`, `/sign-up` (StitchAuthLayout + Clerk + role tabs) |
| LIME Event Landing Page (Full) | `/` (`LandingPage.tsx`) |
| browse_artists | `/artists` |
| create_new_event | `/events/new` |
| artist_profile_public | `/artists/[id]` |
| organizer_dashboard | `/dashboard` |
| admin_dashboard | `/admin` |

Additional Stitch screens (booking flow, contract sign, earnings) can be added as follow-up pages.
