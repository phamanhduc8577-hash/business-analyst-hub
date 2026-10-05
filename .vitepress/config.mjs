import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Business Analyst Knowledge Hub",
  description: "Curated Knowledge Base, Templates & AI Skill for Business Analysts & Engineering Teams",
  base: "/business-analyst-hub/",
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Elicitation', link: '/docs/01-elicitation/CHECKLIST-ELICITATION' },
      { text: 'Templates', link: '/docs/02-templates/prd/PRD-TEMPLATE' },
      { text: 'Modeling & BDD', link: '/docs/03-modeling-and-specs/mermaid-diagrams/MERMAID-MODELING-GUIDE' },
      { text: 'Data Dictionary', link: '/docs/04-data-dictionary/DATA-DICTIONARY-TEMPLATE' },
      { text: 'Vietnam Payments', link: '/docs/05-domain-knowledge/ecommerce-retail/CASE-STUDY-VIETNAM-PAYMENTS' },
      { text: 'AI BA Skill', link: '/docs/ai-skill' }
    ],

    sidebar: [
      {
        text: '📌 01. Elicitation & Discovery',
        items: [
          { text: 'Checklist Elicitation (BABOK v3)', link: '/docs/01-elicitation/CHECKLIST-ELICITATION' }
        ]
      },
      {
        text: '📋 02. Templates & Standards',
        items: [
          { text: 'Product Requirements (PRD)', link: '/docs/02-templates/prd/PRD-TEMPLATE' },
          { text: 'Business Requirements (BRD)', link: '/docs/02-templates/brd/BRD-TEMPLATE' },
          { text: 'Software Requirements (SRS/FRD)', link: '/docs/02-templates/frd-srs/SRS-FRD-TEMPLATE' },
          { text: 'Traceability Matrix (RTM)', link: '/docs/02-templates/rtm/RTM-TEMPLATE' }
        ]
      },
      {
        text: '📐 03. Modeling & BDD Guidelines',
        items: [
          { text: 'Mermaid.js Visual Modeling', link: '/docs/03-modeling-and-specs/mermaid-diagrams/MERMAID-MODELING-GUIDE' },
          { text: 'Gherkin BDD Acceptance Criteria', link: '/docs/03-modeling-and-specs/gherkin-bdd/GHERKIN-BDD-GUIDELINES' }
        ]
      },
      {
        text: '📊 04. Data Modeling',
        items: [
          { text: 'Data Dictionary & Schema Catalog', link: '/docs/04-data-dictionary/DATA-DICTIONARY-TEMPLATE' }
        ]
      },
      {
        text: '📚 05. Domain Knowledge',
        items: [
          { text: 'Enterprise AI RAG & Multi-Agent', link: '/docs/05-domain-knowledge/ai-systems-rag/ENTERPRISE-RAG-MULTIAGENT-SPEC' },
          { text: 'RWA Tokenization (ERC-3643)', link: '/docs/05-domain-knowledge/crypto-web3-rwa/RWA-TOKENIZATION-SPEC' },
          { text: 'Smart WMS/TMS & Cold Chain', link: '/docs/05-domain-knowledge/logistics-supply-chain/SMART-WMS-TMS-SPEC' },
          { text: 'ISO 20022 Payments & SEPA', link: '/docs/05-domain-knowledge/payments-iso20022/ISO-20022-PAYMENTS-GUIDE' },
          { text: 'Commercial Lending & Credit Risk', link: '/docs/05-domain-knowledge/banking-finance/COMMERCIAL-LENDING-CREDIT-RISK-GUIDE' },
          { text: 'Healthcare Claims Adjudication', link: '/docs/05-domain-knowledge/insurance-healthcare/HEALTH-INSURANCE-CLAIMS-GUIDE' },
          { text: 'E-Commerce & Retail Systems', link: '/docs/05-domain-knowledge/ecommerce-retail/ECOMMERCE-RETAIL-SYSTEMS-GUIDE' },
          { text: 'Telecom BSS/OSS Systems', link: '/docs/05-domain-knowledge/telecom-saas-esg/TELECOM-SAAS-SYSTEMS-GUIDE' },
          { text: 'Case Study: Vietnam Payments', link: '/docs/05-domain-knowledge/ecommerce-retail/CASE-STUDY-VIETNAM-PAYMENTS' }
        ]
      },
      {
        text: '🤖 AI Agent Integration',
        items: [
          { text: 'AI Business Analyst Skill', link: '/docs/ai-skill' }
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
