export interface Experience {
  year: string;
  role: string;
  company: string;
  description: string;
  tech: string[];
}

export const EXPERIENCES: Experience[] = [
  {
    year: 'Apr.2025 Present',
    role: 'Fullstack Developer',
    company: 'Sabicoder',
    description: 'create a few projects and share to the world',
    tech: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
  },
  {
    year: 'Sep.2025 Present',
    role: 'Provincial gifted student competition',
    company: 'DSA Learning',
    description:
      'Preparing to compete in the provincial gifted student contest in Vietnam, which evaluates advanced algorithmic knowledge and problem-solving ability.',
    tech: ['C++', 'Python'],
  },
  {
    year: '2024 - 2025',
    role: 'Basic Web development',
    company: 'Learning',
    description: 'learning web development and other related stuff',
    tech: ['Html', 'Css', 'js', 'Node.js'],
  },
  {
    year: 'Mar.2024',
    role: 'STEM Development in School',
    company: 'High School',
    description:
      'I was able to learn some basic programming knowledge and create a game projects',
    tech: ['Python'],
  },
];
