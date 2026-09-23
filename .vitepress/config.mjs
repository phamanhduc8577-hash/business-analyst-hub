import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Business Analyst Knowledge Hub",
  description: "Curated Knowledge Base, Templates & AI Skill for Business Analysts & Engineering Teams",
  base: "/business-analyst-hub/",

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Elicitation', link: '/01-elicitation/CHECKLIST-ELICITATION' },
      { text: 'Templates', link: '/02-templates/prd/PRD-TEMPLATE' },
      { text: 'Modeling & BDD', link: '/03-modeling-and-specs/mermaid-diagrams/MERMAID-MODELING-GUIDE' },
      { text: 'Data Dictionary', link: '/04-data-dictionary/DATA-DICTIONARY-TEMPLATE' },
      { text: 'Vietnam Payments', link: '/05-domain-knowledge/ecommerce-retail/CASE-STUDY-VIETNAM-PAYMENTS' },
      { text: 'AI BA Skill', link: '/skills/ai-business-analyst' }
    ],

    sidebar: [
      {
        text: '📌 01. Elicitation & Discovery',
        items: [
          { text: 'Checklist Elicitation (BABOK v3)', link: '/01-elicitation/CHECKLIST-ELICITATION' }
        ]
      },
      {
        text: '📋 02. Templates & Standards',
        items: [
          { text: 'Product Requirements (PRD)', link: '/02-templates/prd/PRD-TEMPLATE' },
          { text: 'Business Requirements (BRD)', link: '/02-templates/brd/BRD-TEMPLATE' },
          { text: 'Software Requirements (SRS/FRD)', link: '/02-templates/frd-srs/SRS-FRD-TEMPLATE' },
          { text: 'Traceability Matrix (RTM)', link: '/02-templates/rtm/RTM-TEMPLATE' }
        ]
      },
      {
        text: '📐 03. Modeling & BDD Guidelines',
        items: [
          { text: 'Mermaid.js Visual Modeling', link: '/03-modeling-and-specs/mermaid-diagrams/MERMAID-MODELING-GUIDE' },
          { text: 'Gherkin BDD Acceptance Criteria', link: '/03-modeling-and-specs/gherkin-bdd/GHERKIN-BDD-GUIDELINES' }
        ]
      },
      {
        text: '📊 04. Data Modeling',
        items: [
          { text: 'Data Dictionary & Schema Catalog', link: '/04-data-dictionary/DATA-DICTIONARY-TEMPLATE' }
        ]
      },
      {
        text: '🇻🇳 05. Domain Knowledge',
        items: [
          { text: 'Case Study: Vietnam Payments (VNPAY/MoMo)', link: '/05-domain-knowledge/ecommerce-retail/CASE-STUDY-VIETNAM-PAYMENTS' }
        ]
      },
      {
        text: '🤖 AI Agent Integration',
        items: [
          { text: 'AI Business Analyst Protocol', link: '/skills/ai-business-analyst' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/phamanhduc8577-hash/business-analyst-hub' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Business Analyst Knowledge Hub'
    }
  }
})
