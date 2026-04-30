export const personalInfo = {
  name: 'Abhishek Pratap Singh',
  title: 'Full Stack Developer & DevOps Engineer',
  graduation: 'B.Tech — Computer Science & Engineering',
  email: 'aps11102003@gmail.com',
  github: 'https://github.com/abhisheksinghp1',
  linkedin: 'https://www.linkedin.com/in/abhisheksinghp1/',
  instagram: 'https://www.instagram.com/abhisheksinghp1',
  location: 'Azamgarh, Uttar Pradesh, India',
  bio: "I'm a passionate Full Stack Developer and DevOps Engineer who loves building scalable, production-ready applications. From crafting elegant APIs with FastAPI to orchestrating containers with Kubernetes — I turn complex problems into clean solutions.",
  taglines: [
    'Full Stack Developer',
    'DevOps Engineer',
    'Python Enthusiast',
    'API Architect',
    'Cloud Native Builder',
  ],
}

export const skills = [
  {
    category: 'Backend',
    icon: '⚙️',
    color: '#6c63ff',
    items: [
      { name: 'Python', level: 95 },
      { name: 'FastAPI', level: 90 },
      { name: 'Django', level: 88 },
      { name: 'Flask', level: 85 },
    ],
  },
  {
    category: 'DevOps',
    icon: '🚀',
    color: '#43e97b',
    items: [
      { name: 'Docker', level: 88 },
      { name: 'Kubernetes', level: 80 },
      { name: 'Terraform', level: 75 },
      { name: 'Jenkins', level: 78 },
    ],
  },
  {
    category: 'Database',
    icon: '🗄️',
    color: '#ff6584',
    items: [
      { name: 'MySQL', level: 85 },
      { name: 'PostgreSQL', level: 82 },
    ],
  },
]

export const projects = [
  {
    id: 1,
    title: 'CloudDeploy — CI/CD Pipeline Automation',
    description:
      'A fully automated CI/CD pipeline using Jenkins, Docker, and Kubernetes. Reduced deployment time by 70% with zero-downtime rolling updates and automated rollback on failure.',
    tech: ['Jenkins', 'Docker', 'Kubernetes', 'Python', 'Terraform'],
    color: '#6c63ff',
    icon: '🚀',
    github: '#',
    live: '#',
    stats: { stars: 128, forks: 34 },
  },
  {
    id: 2,
    title: 'SwiftAPI — High-Performance REST Framework',
    description:
      'A production-grade REST API built with FastAPI and PostgreSQL, handling 10k+ requests/sec. Features JWT auth, rate limiting, async DB queries, and auto-generated OpenAPI docs.',
    tech: ['FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'Python'],
    color: '#43e97b',
    icon: '⚡',
    github: '#',
    live: '#',
    stats: { stars: 94, forks: 21 },
  },
  {
    id: 3,
    title: 'InfraForge — Infrastructure as Code Platform',
    description:
      'A web-based IaC management platform built on Django. Provision AWS resources via Terraform templates through a clean UI. Supports multi-environment deployments with state management.',
    tech: ['Django', 'Terraform', 'AWS', 'MySQL', 'React'],
    color: '#ff6584',
    icon: '🏗️',
    github: '#',
    live: '#',
    stats: { stars: 76, forks: 18 },
  },
  {
    id: 4,
    title: 'DataPulse — Real-Time Analytics Dashboard',
    description:
      'A real-time analytics dashboard using Flask and WebSockets. Visualizes live metrics from PostgreSQL with sub-second latency. Containerized with Docker Compose for easy local dev.',
    tech: ['Flask', 'WebSockets', 'PostgreSQL', 'Docker', 'Chart.js'],
    color: '#f7971e',
    icon: '📊',
    github: '#',
    live: '#',
    stats: { stars: 61, forks: 15 },
  },
  {
    id: 5,
    title: 'SecureVault — Secrets Management Service',
    description:
      'A microservice for managing application secrets and environment configs. Built with FastAPI, encrypted at rest with AES-256, deployed on Kubernetes with RBAC and audit logging.',
    tech: ['FastAPI', 'Kubernetes', 'Python', 'PostgreSQL', 'Docker'],
    color: '#a18cd1',
    icon: '🔐',
    github: '#',
    live: '#',
    stats: { stars: 53, forks: 12 },
  },
]

export const stats = [
  { label: 'Projects Built', value: 20, suffix: '+' },
  { label: 'GitHub Stars', value: 400, suffix: '+' },
  { label: 'Cups of Coffee', value: 1200, suffix: '+' },
  { label: 'Lines of Code', value: 50, suffix: 'k+' },
]
