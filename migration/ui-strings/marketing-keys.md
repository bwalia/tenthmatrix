# Marketing route UI strings (proposed keys)

Used by `src/app/components/sections/**` and the marketing routes under `src/app/[locale]/`.
The English values currently live in `src/app/components/sections/ui.js` (`UI_DEFAULTS`), because these
routes may not edit `src/messages`. A page JSON `ui` block can override any of them per locale.

To localise: add a `marketing` namespace to `src/messages/en.json` with the keys below, run the i18n
pipeline, then swap `uiStrings(data.ui)` for `getTranslations({ locale, namespace: "marketing" })`
(one place: `ui.js`). Until then non-English locales show these labels in English.

| key | en |
|---|---|
| `marketing.lastUpdated` | Last updated |
| `marketing.effective` | Effective |
| `marketing.contents` | On this page |
| `marketing.contact` | Contact |
| `marketing.email` | Email |
| `marketing.phone` | Phone |
| `marketing.startingFrom` | Starting from |
| `marketing.whatWeDeliver` | What we deliver |
| `marketing.whatsIncluded` | What's included |
| `marketing.mostPopular` | Most popular |
| `marketing.keyBenefits` | Key benefits |
| `marketing.capabilities` | Capabilities |
| `marketing.useCases` | Use cases |
| `marketing.realWorldUseCases` | Real-world use cases |
| `marketing.features` | Features |
| `marketing.faq` | Frequently asked questions |
| `marketing.news` | Latest news |
| `marketing.pricing` | Pricing |
| `marketing.video` | Watch the overview |
| `marketing.playVideo` | Play video |
| `marketing.watchOnYouTube` | Watch on YouTube |
| `marketing.watchVideo` | Watch the video |
| `marketing.date` | Date |
| `marketing.location` | Location |
| `marketing.format` | Format |
| `marketing.duration` | Duration |
| `marketing.eventDetails` | Event details |
| `marketing.topics` | Topics |
| `marketing.highlights` | Highlights |
| `marketing.aspect` | Aspect |
| `marketing.traditional` | Traditional approach |
| `marketing.agentWorkflow` | Agent workflow |
| `marketing.improvement` | Improvement |
| `marketing.build` | Build |
| `marketing.buy` | Buy |
| `marketing.recommendation` | Recommendation |
| `marketing.category` | Category |
| `marketing.year1` | Year 1 |
| `marketing.year2` | Year 2 |
| `marketing.notes` | Notes |
| `marketing.total` | Total estimated |
| `marketing.addons` | Add-ons |
| `marketing.enterprise` | Enterprise |
| `marketing.contactSales` | Talk to us |
| `marketing.bookNow` | Book a call |
| `marketing.learnMore` | Read more |
| `marketing.visitSite` | Visit site |
| `marketing.partnership` | Partnership |
| `marketing.integration` | Integration |
| `marketing.benefits` | Benefits |
| `marketing.aiPartners` | AI and model partners |
| `marketing.partnerCtaTitle` | Partner with TenthMatrix |
| `marketing.partnerCtaBody` | Building agent tooling, model platforms or developer infrastructure? Tell us how an integration would work. |
| `marketing.technologyPartners` | Technology partners |
| `marketing.expertise` | Expertise |
| `marketing.whyCtaTitle` | Start with one job your team does every day |
| `marketing.whyCtaBody` | Describe it in a paragraph. We will come back with an agent design, the risks and a sensible pilot. |
| `marketing.aboutCtaTitle` | Work with the TenthMatrix team |
| `marketing.aboutCtaBody` | Tell us what you want your agents to do. We reply within one working day. |
| `marketing.whyLink` | Why TenthMatrix |
| `marketing.team` | Team |
| `marketing.values` | Values |
| `marketing.achievements` | Achievements |
| `marketing.byTheNumbers` | By the numbers |
| `marketing.stage` | Stage |
| `marketing.detail` | Detail |
| `marketing.code` | Code |
| `marketing.meaning` | Meaning |
| `marketing.responseCodes` | Response codes |
| `marketing.status` | Status |
| `marketing.hardwareTitle` | Need the hardware? |
| `marketing.hardwareBody` | GPU workstations, DGX systems and Mac Studio builds for running these agents locally are on Workstation, our hardware partner site. |
| `marketing.hardwareLink` | AI workstations on Workstation |
| `marketing.sitemapXml` | XML sitemap |
| `marketing.industries` | Industries |
| `marketing.ctaIndustriesTitle` | Talk to us about your sector |
| `marketing.ctaIndustriesBody` | Tell us the regulations, systems and constraints you work under. We will come back with a scoped first project. |
| `marketing.ourCustomers` | Our customers |
| `marketing.storiesLede` | What teams changed after putting TenthMatrix software and services into production. |
| `marketing.storiesCtaTitle` | Want results like these? Tell us what you are building. |
| `marketing.stats` | Results |
| `marketing.modules` | Modules |
| `marketing.module` | Module |
| `marketing.included` | Included |
| `marketing.notIncluded` | Not included |
| `marketing.starter` | Starter |
| `marketing.professional` | Professional |
| `marketing.startTrial` | Start a trial |
| `marketing.scheduleDemo` | Book a demo |
| `marketing.integrations` | Integrations |
| `marketing.testimonials` | What customers say |
| `marketing.implementation` | Implementation |
| `marketing.technical` | Technical details |
| `marketing.solutionsTitle` | TenthMatrix AI solutions |
| `marketing.certifications` | Certifications and compliance |
| `marketing.performanceMetrics` | Performance metrics |
| `marketing.quality` | Quality |
| `marketing.support` | Support |
| `marketing.challenge` | Challenge |
| `marketing.approach` | Our approach |
| `marketing.impact` | Impact |
| `marketing.pain` | The prolonged pain |
| `marketing.solution` | How AI helps |
| `marketing.result` | Business result |
| `marketing.whenRight` | When this is right |
