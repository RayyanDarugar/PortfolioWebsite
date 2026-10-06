/**
 * The résumé, from rayyan-stuff/Darugar_Rayyan_9.18.2026.pdf. The PDF itself
 * is served at /resume.pdf; update both together.
 */

export interface Role {
  org: string
  title: string
  dates: string
  place: string
  bullets: readonly string[]
}

export interface School {
  name: string
  degree: string
  place: string
}

export const RESUME: {
  pdf: string
  education: {
    program: string
    detail: string
    schools: readonly School[]
    honors: string
  }
  experience: readonly Role[]
  leadership: readonly Role[]
  skills: readonly { label: string; items: string }[]
} = {
  pdf: '/resume.pdf',
  education: {
    program: 'World Bachelor in Business',
    detail: 'Expected May 2029 · GPA 3.96',
    schools: [
      { name: 'University of Southern California', degree: 'B.S. Business Administration', place: 'Los Angeles' },
      { name: 'Hong Kong University of Science and Technology', degree: 'Bachelor of Business Administration', place: 'Hong Kong' },
      { name: 'Bocconi University', degree: 'B.S. Business', place: 'Milan' },
    ],
    honors: 'WBB Academic Merit Scholar, National Merit Scholar, Dean’s List',
  },
  experience: [
    {
      org: 'super{set} Venture Studio',
      title: 'GTM Engineer | VC Analyst Intern',
      dates: 'May 2026 – August 2026',
      place: 'San Francisco, CA',
      bullets: [
        'Built an automated VC sourcing, scoring, and engagement pipeline in HubSpot/n8n that booked 5 completed founder meetings',
        'Shipped a fully automated B2C social marketing platform driving ~20,000 TikTok views and ~600 engagements in a week',
        'Spearheaded Product for an early-stage API gateway platform: surfaced 4 critical bugs, 10 UI improvements',
        'Created a portfolio-wide knowledge base turning individual expertise into community knowledge; drew 25+ contributions',
      ],
    },
    {
      org: 'Kana',
      title: 'GTM Engineer',
      dates: 'May 2026 – August 2026',
      place: 'San Francisco, CA',
      bullets: [
        'Built outbound analytics platform covering 13,000+ touches, leading to the cut of $10,000/month in wasted channel spend',
        'Designed targeted inbound copy, websites, and content across 9 industry verticals, pushing 20 pieces of content to production',
      ],
    },
    {
      org: 'TroyLabs',
      title: 'Head of Ignite | Product Manager',
      dates: 'September 2025 – Current',
      place: 'Los Angeles, CA',
      bullets: [
        'Founded member accelerator program, training 25+ students in product management, engineering, finance, marketing, and design',
        'Led team of 6 to win $8500+ across 3 competitions: First Place (x2), Audience Choice; Secured 3 investor meetings',
        'Ran 400+ user interviews, defined 3 segments, and produced branding, bottle design, and packaging in Figma',
        'Built GTM strategy securing 3 letters of intent from BevMo, Total Wine, and Walmart',
      ],
    },
    {
      org: 'USC Business Technology Group',
      title: 'Senior Innovation Consultant, Adobe, META',
      dates: 'September 2025 – Current',
      place: 'Los Angeles, CA',
      bullets: [
        'Ran 60 user interviews identifying onboarding friction in an Adobe app; prototyped feature-nesting and naming redesigns in Figma',
        'Defined initial channels for a META flagship product, interviewing ~15 doctors and prototyping industry specific uses',
      ],
    },
    {
      org: 'Hemut (YC X25)',
      title: 'Student Data Engineer | Student Business Analyst',
      dates: 'August 2025 – May 2026',
      place: 'Los Angeles, CA',
      bullets: [
        'Supported investor materials for a multi-million-dollar seed round and tracked a $200,000+ friends-and-family round',
        'Managed an outbound sales team running 100 cold calls weekly, generating ~$104,000 in deals-in-progress',
        'Produced research reports covering 54 LA-based VC firms, 15+ fuel-card carriers, and the TMS software landscape',
      ],
    },
    {
      org: 'Office of Supervisor Joel Anderson',
      title: 'District 2 Intern',
      dates: 'June 2023 – September 2023',
      place: 'San Diego, CA',
      bullets: [
        'Aligned with City of San Diego Supervisor’s political vision and messaging to organize and write 5+ briefs and releases',
        'Oversaw a group of 10+ interns to run public government events such as town hall meetings and program surveys',
        'Headed certificate program improving community relations by recognizing 500+ important members of San Diego',
      ],
    },
  ],
  leadership: [
    {
      org: 'California DECA',
      title: 'President of Southern California',
      dates: 'November 2022 – April 2025',
      place: 'San Diego, CA',
      bullets: [
        'Built first-ever Southern California District Action Team impacting 2000+ SoCal DECA members',
        'Designed campaign recognizing 500+ California DECA members at the International Career Development Conference',
      ],
    },
  ],
  skills: [
    { label: 'Engineering', items: 'TypeScript, Python, JavaScript, SQL, Swift, React/Next.js, Electron, Vercel, Supabase' },
    { label: 'AI systems', items: 'Claude Code, MCP servers, agent orchestration, n8n, webhooks, Higgsfield, ElevenLabs' },
    { label: 'GTM & research', items: 'HubSpot, Clay, Instantly, Valley, Linear, ICP definition, sentiment/channel analysis, Dune, Messari' },
    { label: 'Product & design', items: 'Figma, user interviewing, segmentation, prototyping' },
    { label: 'Politics', items: 'Speechwriting, policy communication, cross-cultural communication, constituency relations, town halls, conflict resolution' },
    { label: 'Interests', items: 'Boxing, Jiu-Jitsu, Soccer, Volleyball, Sports Videography, Portrait Photography, Surfing & Boogie Boarding, Cooking' },
  ],
}
