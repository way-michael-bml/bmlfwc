# Banner Mountain Lookout Firewise Community — Website Specification

## Context

Why we are starting a new fire wise communit
- Dissolution of the Banner Mountain Firewise Community
The Territory Was Simply Too Large
The original Banner Mountain Firewise boundary covered a massive geographic area with thousands of residents. Managing a singular National Fire Protection Association (NFPA) Firewise certification for a territory that large becomes an administrative bottleneck. Tracking the required volunteer hours, fuel reduction investments, and community outreach for an entire mountain under one umbrella is incredibly difficult for a volunteer board to sustain long-term.

- A Shift Toward Smaller, Hyper-Local Neighborhoods
Wildfire mitigation and evacuation planning are most effective when organized at the immediate street or neighborhood level. Because Banner Mountain features varying terrains, localized choke points, and micro-neighborhoods, the regional coordinators (including the Fire Safe Council of Nevada County and the Wildfire Ready Coalition) advocate for smaller, more agile Firewise Communities.

A new Firewise USA community in Nevada City, CA (Sierra Nevada foothills) needs a public website to:
- Educate residents on fire-resilient forest management specific to their mixed-conifer/oak landscape
- Coordinate recognition compliance - see docs\FirewiseCommunityEstablishmentProcess.docx
- Advocate for fire hydrant installation on Banner Lava Cap Road (NID water lines are already pressurized; hydrants were never added)
-- see map of fire hydrants for our neighborhood:  maps\nid_firehydrant_map need to add graphic for section between wings of morning and starwood
-- see very rough draft of letter and petition: docs\fire_hydrant_petition
- Provide emergency preparedness resources + community alert signup

Sole maintainer. Content updates will be infrequent (news, meeting notes, goal progress). Static site is the right fit.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Astro** | Content-first, fast, Markdown-driven, component islands for interactivity |
| Styling | **Tailwind CSS** | Utility-first, easy to maintain solo |
| Hosting | **Netlify** (free tier) | Built-in form handling, continuous deploy from Git, custom domain support |
| CMS | **Decap CMS** (optional, add later) | Browser-based editor for Markdown content; add if Git editing feels tedious |
| Email alerts | **Netlify Forms + Mailchimp free** | Signup form → Mailchimp audience for broadcast emails |

Color palette: earth tones — forest green (#2D5016), warm amber (#C17D3C), cream (#F5F0E8), charcoal (#2C2C2C).

---

## Site Map

### 1. Home (`/`)
- Hero: community name, tagline ("Building a Fire Resilent Neighborhood")
- Current fire danger badge → links to CAL FIRE daily conditions
- Latest news snippet (2–3 recent posts)
- Quick-link cards: Our Forest · Defensible Space · Emergency Prep · Get Involved
- Firewise USA recognition badge + link to About

### 2. About (`/about`)
- What is Firewise USA (NFPA recognition program)
- Our community: Banner Mountain east/north and south/west slopes, history of mining, logging, unmanaged regrowth and construction of homes - burden placed on residents
- Recognition status and annual investment tracking (volunteer hours + project spend)
- Community map (embedded Google Maps or static image)

### 3. Our Forest (`/forest`)
The signature educational section. Split into three sub-pages or tabs:

**3a. Healthy Forest Profile**
- What a healthy Sierra Nevada mixed-conifer forest looks like: structure, layering, canopy gaps
- Target tree density by slope aspect:
  - East/North slopes (Douglas Fir, Incense Cedar, Ponderosa, Sugar Pine, Black Oak, Dogwood)
  - South/West slopes (Ponderosa, Douglas Fir, Manzanita understory)
- Why dense post-logging regrowth is dangerous (competition stress, ladder fuels, snow load)
- Photo examples: overcrowded vs. properly spaced stands
- graphic showing how to estimate proper tree density

**3b. Tree Health & Safety**
- Species-by-species health indicators: mechanical failure risk & trees growing into other trees
- Snow load: which species/forms fail under wet Sierra snow; v-fork vs. single-leader risk; weak trees due to growing in overcrowded conditions
- Prioritizing removals: dead, dying, leaning, ladder-fuel candidates
- When to call an arborist vs. DIY

**3c. Short & Long-Term Goals**
- Short-term (1–2 yr):
  1. Achieve Firewise USA recognition (complete investment requirements, submit NFPA application)
  2. Hydrant installation advocacy — pressure NID and Nevada County Fire Chief to add hydrants to the existing Banner Lava Cap pressurized water lines
- Long-term (5–10 yr):
  1. Reach and maintain target tree density (trees/acre) for fire and snow resilience across all slope aspects
  2. Maintain ongoing annual Firewise USA recognition status
  3. Establish a community-wide annual chipping program for brush and slash
  4. Pursue grants (CAL FIRE, FEMA BRIC, Nevada County Fire Safe Council) to fund property cleanup and treatment of adjacent vacant parcels
  5. Home hardening
- Progress tracker / milestones checklist

### 4. Defensible Space (`/defensible-space`)
- California-specific framework (Public Resource Code 4291):
  - Zone 0 (0–5 ft): ember-resistant zone — no wood mulch, no dead plants, non-combustible hardscape
  - Zone 1 (0–30 ft): lean, clean, green — spacing, ladder fuel removal
  - Zone 2 (30–100 ft): reduce fuel continuity
- Downloadable checklist (PDF or printable page)
- Home hardening section: vents, eaves, decking materials, window types
- Links to CAL FIRE and Nevada County Fire Safe Council resources

### 5. Advocacy: Fire Hydrants (`/hydrants`)
- Clearly explain the situation: NID upgraded water lines on Banner Lava Cap to pretreated, pressurized lines with sufficient capacity — no hydrants were added
- Why this matters: fire engines carry limited water; hydrant access dramatically changes suppression capability
- What we're asking for: hydrant installation at key locations
- Petition / letter of support (embedded form or downloadable letter)
- Who to contact: NID board contact info, Nevada County Fire Chief / Cal Fire Nevada Unit contacts
- Status updates (date-stamped log of outreach and responses)

### 6. Meetings & Events (`/events`)
- Upcoming meetings (date, time, location, agenda link)
- Work party schedule (tree thinning, brush disposal, chipping days)
- Past meeting notes (Markdown files, listed by date)
- Photo gallery from past work parties

### 7. Emergency Preparedness (`/emergency`)
- Neighbor hood contacts and alearts during high fire danger weather events.  GMRS radios and
- Current conditions links: CAL FIRE fire danger map, Nevada County OES, AirNow
- Evacuation routes: map + written description for the Banner Mountain area
- Go-bag checklist (printable)
- Community email alert signup (Netlify Form → Mailchimp)
- Key contacts:
  - Nevada County OES emergency alerts (opt-in link)
  - CAL FIRE Nevada Unit: (530) 273-1795
  - Nevada County Sheriff non-emergency: (530) 265-7880
  - Burn day info line

### 8. Resources (`/resources`)
- External links: NFPA Firewise, CAL FIRE, Nevada County Fire Safe Council, UC Cooperative Extension forestry
- Downloadable guides: NFPA home assessment, CAL FIRE defensible space, home hardening guide
- Firewise recognition documents (annual report template, investment log)

### 9. Contact (`/contact`)
- Contact form (Netlify Forms)
- Optionally: link to Nextdoor or neighborhood email group

---

## Content Architecture

```
src/
  content/
    news/          # Markdown posts — title, date, summary, body
    events/        # Markdown — title, date, time, location, agenda
    meeting-notes/ # Markdown — title, date, body
  pages/           # Astro pages for each route above
  components/      # Reusable: NavBar, Footer, FireDangerBadge, NewsCard, GoalTracker
```

---

## Key Content To Gather Before Build

- [ ] Community map image or GPS boundary
- [ ] Short-term and long-term resilience goals (user to define)
- [ ] Specific NID water line upgrade documentation (for advocacy page)
- [ ] Names/contact info for NID board contacts and Fire Chief
- [ ] Evacuation route description for Banner Mountain area
- [ ] Photos of the current forest / any before-after examples
- [ ] Firewise recognition status (applied? pending? in progress?)

---

## Verification

1. `npm run dev` → check all pages render with correct nav and content
2. Test Netlify form submissions in preview deploy
3. Verify fire danger badge links resolve to CAL FIRE
4. Check mobile responsiveness (residents will view on phones during emergencies)
5. Validate all external resource links

---

## Phased Build Order

1. **Phase 1** — Core skeleton: Home, About, Our Forest (3a), Defensible Space
2. **Phase 2** — Advocacy page (hydrants), Emergency Prep with alert signup
3. **Phase 3** — Events/meetings, Resources, Contact
4. **Phase 4** — Forest Goals tracker, photo gallery, optional Decap CMS
