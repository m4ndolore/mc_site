From a company's card, the URL for one of the companies is not connecting because the page directs to https//trackablehealth.ai. 

Zeromark on the other hand seems to direct without a https or subdomain and so that page does load.

In the small modal that opens up when you click on a query result for an abbreviated company's card, the URL for one of the companies is not connecting either and redirects to a nonexistent page.

My Company - Once a request is initiated, if I go back to My Company page it should not allow me to search again. I should instead be presented w/ the response page from the request.

Notification system

Launch YC like interface

Company matching could be automated if the user meets a few critical criteria.

- PACAF Intelligence Hub (/pacaf-hub/) – Create a page
    titled “PACAF Intelligence Hub”, set the slug to pacaf-
    hub, and choose the custom-pacaf-hub template. This
    page is wired up in ghost-cloudrun/routes.yaml:30-33
    and called out in the quick-start guide (_docs/features/
    PACAF_QUICK_START.md:14-40). Without it, the hub route
    404s.
  - PACAF Program Matcher (/pacaf-matcher/) – New page
    “PACAF Program Matcher”, slug pacaf-matcher, template
    custom-pacaf-matcher. Same references as above (_docs/
    features/PACAF_QUICK_START.md:24-32, ghost-cloudrun/
    routes.yaml:34-37).
  - PACAF Program detail shell (/pacaf-program/) – Page
    “PACAF Program”, slug pacaf-program, template custom-
    pacaf-program. This single template handles all ?id=...
    program detail views so it must exist for the router
    entry at ghost-cloudrun/routes.yaml:38-40. The setup
    steps are in _docs/features/PACAF_QUICK_START.md:34-40.
  - PACAF Demand Profile (/pacaf-demand/ or /pacaf-demand-
    profile/) – We ship a dedicated template (ghost-cloudrun/
    ghost-data/themes/ease/custom-pacaf-demand.hbs:4-34) and
    link to it from the hub CTA (ghost-cloudrun/ghost-data/
    themes/ease/custom-pacaf-hub.hbs:150-157). Recreate a
    page (e.g., title “PACAF Demand Profile”, slug matching
    the route you want) and pick the custom-pacaf-demand
    template; that exposes the PDF download/iframe content
    again.