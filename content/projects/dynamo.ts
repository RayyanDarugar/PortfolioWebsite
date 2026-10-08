import type { Project } from './types'

/** Agent Dynamo. The problem is Rayyan's own framing of it; metrics, media
 *  and the live link come when he sends them. */
export const DYNAMO: Project = {
  slug: 'dynamo',
  name: 'Agent Dynamo',
  tagline: 'The AI agent platform I founded.',
  role: 'Founder',
  order: 1,
  icon: 'bolt',
  tile: 'linear-gradient(#FFB648,#E2561F)',
  problem: [
    'Big companies are racing to build and deploy AI agents, and the way they are doing it is not working. MIT reports that 95% of companies trying this create zero value, an estimated $38 billion lost.',
    'The people who understand the work are not the ones building the agents. Every company runs procurement, finance and operations its own way, and an agent built without that knowledge does not survive contact with it.',
  ],
  built: [
    'Agent Dynamo puts building agents in the hands of the professionals who understand the work. What a company buys with Dynamo is an agent that is actually profitable, and a high chance it succeeds.',
  ],
}
