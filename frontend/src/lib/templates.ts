import type { PromptTemplate } from '../types'

export const TEMPLATES: PromptTemplate[] = [
  {
    id: 'verbose-email',
    name: 'Verbose support email',
    category: 'Communication',
    description: 'Polite, padded customer-service style — great to demo token reduction.',
    prompt:
      "Hi there! I hope this message finds you well. I would like to kindly ask you, please, if you could in order to help me, give a very detailed explanation of how recursion works in Python. Basically, I just want to actually understand it. It is important to note that I am a beginner. Due to the fact that I have never used recursion, could you please walk me through the topic step by step. Please note that I would really appreciate it if you could include examples. Thank you so much!",
  },
  {
    id: 'data-chart',
    name: 'Monthly revenue chart',
    category: 'Charts & Data',
    description: 'Numeric data — auto-detects chart intent.',
    prompt:
      'Generate a bar chart of monthly revenue for 2023. Data: Jan 10k, Feb 15k, Mar 22k, Apr 18k, May 25k, Jun 30k, Jul 28k, Aug 32k, Sep 35k, Oct 40k, Nov 38k, Dec 45k. Highlight the trend and call out the top 3 months.',
  },
  {
    id: 'compare-frameworks',
    name: 'React vs Vue vs Svelte',
    category: 'Comparison',
    description: 'Comparison phrasing — auto-detects table format.',
    prompt:
      'Compare React, Vue, and Svelte for a small startup building an internal admin dashboard. Cover developer experience, bundle size, ecosystem maturity, hiring availability, and learning curve. Recommend one and justify the pick.',
  },
  {
    id: 'code-refactor',
    name: 'Refactor a Python function',
    category: 'Code',
    description: 'Code intent — auto-detects fenced-blocks contract.',
    prompt:
      'Refactor this Python function to be more idiomatic and add type hints. Also explain what changed.\n\n```python\ndef get(x):\n  r = []\n  for i in x:\n    if i % 2 == 0:\n      r.append(i*i)\n  return r\n```',
  },
  {
    id: 'concept-explainer',
    name: 'Explain CAP theorem to a beginner',
    category: 'Explanation',
    description: 'Explanation intent — auto-detects step-by-step structure.',
    prompt:
      'Explain the CAP theorem for someone who has never used a distributed database. Walk me through what consistency, availability, and partition tolerance mean, then give an example of a real system that prioritises each.',
  },
  {
    id: 'mermaid-flow',
    name: 'OAuth flow diagram',
    category: 'Diagrams',
    description: 'Asks for a Mermaid sequence diagram.',
    prompt:
      'Show me a Mermaid sequence diagram for the OAuth 2.0 authorization-code flow with PKCE, between a SPA, an auth server, and a resource API. Annotate which steps are over the front channel vs back channel.',
  },
]
