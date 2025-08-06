# CityBean Coffee – Demo Workspace Specification

## 1 Company Snapshot

**CityBean Coffee** is a fast‑growing regional chain with **17 company‑owned cafés** and **24 franchise locations**. Their competitive moat is **BeanFlow**, an in‑house cloud platform that unifies:

* **Dynamic supply chain:** real‑time green‑bean purchasing, roast scheduling, perishables forecasting.
* **POS + loyalty:** tap‑to‑pay app, pre‑pay pickup lanes, tiered rewards.
* **Ops dashboards:** store traffic heat‑maps, espresso‑machine downtime alerts, barista performance metrics.
  The brand positions itself as “Starbucks meets DevOps”—a coffee company that iterates like a software startup.

---

## 2 Primary Workspace User

| Field                  | Value                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| **Persona**            | Owner / CEO – founder‑operator who oversees both corporate cafés and the franchise program.              |
| **Goals in workspace** | ‑ Monitor KPIs daily‑ Approve marketing assets‑ Review franchise pipeline‑ Tune SOPs and staffing models |
| **Typical questions**  | “Today foot‑traffic swing?” • “TikTok hook pumpkin latte.” • “Lock Q1 coffee futures?”                   |

---

## 3 Workspace Layout

### 3.1 Assistants

| Assistant ID | Display Name | Purpose                                                                 | Data & Tools Plug‑ins                                                |
| ------------ | ------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `market`     | Market       | External‑facing copy, investor comms, competitor intel, campaign ideas. | BeanFlow sales exports, public web search, brand style guide.        |
| `operations` | Operations   | Internal KPIs, scheduling advice, SOP drafting, supply chain analytics. | BeanFlow live API, store sensor feeds, policy docs, weather service. |

### 3.2 Knowledge Base (shared)

* Menu & nutrition sheets  - Franchise manuals  - Supply contracts  - Weekly KPI CSV exports  - HACCP & food‑safety SOPs  - CRM snapshots

### 3.3 Permissions Sketch

* **Owner:** full workspace access.
* **Store managers:** read‑only KPI channels + local SOPs.
* **Franchisees:** sandboxed “Franchise Hub” with manuals and market assistant only.

---

## 4 Seed Conversation Log

Populate the workspace with the following 30 historical chats (all originated by the Owner). Each includes a title and one‑line summary.

| #  | Title                              | Assistant           | Summary                                                                                          |
| -- | ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| 1  | Morning KPI Pulse                  | operations          | Asked for real‑time sales, labor, and waste; returned dashboard, flagged 14 % waste at Store #7. |
| 2  | Rainy‑Day Staffing Fix             | operations          | Simulated weather‑driven schedules; reallocated baristas to drive‑thru at three cafés.           |
| 3  | TikTok Pumpkin Hook                | market              | Generated 10‑sec script + hashtags for pumpkin latte.                                            |
| 4  | Q3 Investor Blurb                  | market              | Drafted 120‑word investor update citing 17 % franchise rev growth.                               |
| 5  | Latte Art Class Promo              | market              | Email + IG copy for Saturday class with Eventbrite link.                                         |
| 6  | Bean Supplier Benchmark            | operations          | Compared two Colombian suppliers; recommended BellaVista to cut costs 4 %.                       |
| 7  | FAQ Refresh                        | market              | Rewrote loyalty FAQ, added Spanish translation.                                                  |
| 8  | Shift Kickoff Checklist            | operations          | Compressed a 4‑page SOP to a 1‑page printable.                                                   |
| 9  | Franchisee Onboarding Video Script | market              | 3‑minute voice‑over script introducing BeanFlow basics.                                          |
| 10 | Drive‑Thru Bottleneck Root‑Cause   | operations          | Analyzed POS timestamps; milk‑steaming delay at Store #12.                                       |
| 11 | Competitor Price Hike Alert        | market              | Summarized Starbucks price changes and margin impact.                                            |
| 12 | Seasonal Menu Brainstorm           | market + operations | Market produced 5 winter drinks; Ops checked ingredient COGS.                                    |
| 13 | Overtime Cost Spike                | operations          | Surfaced OT spike; root cause sick‑leave overlap.                                                |
| 14 | Loyalty‑App Bug Ticket             | operations          | Formatted GitHub issue from crash logs.                                                          |
| 15 | Same‑Store Sales Deck              | market              | Bullet outline for board deck with charts placeholders.                                          |
| 16 | Espresso Grinder RFP               | operations + market | Ops drafted spec & scoring matrix; Market wrote vendor email.                                    |
| 17 | Food‑Safety SOP Simplify           | operations          | Rewrote HACCP section to bullet form, updated FDA temps.                                         |
| 18 | Green‑Bean Futures Update          | market              | Explained futures price drop, suggested locking Q1 contracts.                                    |
| 19 | Holiday Gift Card Banner           | market              | Supplied ad copy variants and alt‑text for Shopify banner.                                       |
| 20 | Cash‑Drawer Variance Alert         | operations          | Detected \$180 variance; outlined investigation + training email.                                |
| 21 | Franchise Royalty Calculator       | operations          | Converted Excel logic into SQL, validated with sample data.                                      |
| 22 | Specialty Milk Cost Analysis       | operations + market | Ops showed oat‑milk share ↑11 %; Market drafted renegotiation email.                             |
| 23 | CSR Impact Report Draft            | market              | 400‑word sustainability recap (composting, carbon footprint).                                    |
| 24 | Weekend Weather Push               | operations + market | Ops fetched forecast; Market crafted geo SMS offers.                                             |
| 25 | Latte‑Art Contest Results          | operations + market | Ops tallied votes; Market tweeted winner copy.                                                   |
| 26 | Daily Coup‑de‑Thé Email            | market              | A/B tested subject lines for matcha promo; chose 32 % open.                                      |
| 27 | PTO Calendar Clash                 | operations          | Flagged overlapping manager PTO; proposed schedule swap, notified HR.                            |
| 28 | New Franchise Pipeline Map         | market              | Summarized CRM: 6 hot leads, 3 in legal review.                                                  |
| 29 | Store‑Layout Heatmap Insight       | operations          | Found underused merch corner; suggested moving pastry display.                                   |
| 30 | Year‑End Strategy Memo             | market + operations | Market drafted 1‑page 2026 vision; Ops appended CapEx forecast.                                  |
