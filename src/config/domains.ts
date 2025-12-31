export interface DomainConfig {
  slug: string;
  pdfPath: string;
  whatsappMessage: string;
  description: string;
}

export const DOMAINS: Record<string, DomainConfig> = {
  'AI & Machine Learning': {
    slug: 'ai-machine-learning',
    pdfPath: '/pdfs/ai-ml-projects.pdf',
    whatsappMessage: 'Hi {name}! 🚀\n\nGet your FREE AI & ML Projects PDF with 20+ project ideas:\n\n{link}\n\nStart building your final year project today! 💪',
    description: 'Intelligent systems, predictive analytics, computer vision, NLP projects'
  },
  'IoT & Embedded Systems': {
    slug: 'iot-embedded-systems',
    pdfPath: '/pdfs/iot-projects.pdf',
    whatsappMessage: 'Hi {name}! 🚀\n\nGet your FREE IoT Projects PDF with 20+ project ideas:\n\n{link}\n\nStart building your final year project today! 💪',
    description: 'Smart devices, sensor networks, automation, real-time monitoring'
  },
  'Cloud Computing': {
    slug: 'cloud-computing',
    pdfPath: '/pdfs/cloud-projects.pdf',
    whatsappMessage: 'Hi {name}! 🚀\n\nGet your FREE Cloud Computing Projects PDF with 20+ project ideas:\n\n{link}\n\nStart building your final year project today! 💪',
    description: 'AWS, Azure, distributed systems, microservices architecture'
  },
  'Web & Mobile Applications': {
    slug: 'web-mobile-applications',
    pdfPath: '/pdfs/web-mobile-projects.pdf',
    whatsappMessage: 'Hi {name}! 🚀\n\nGet your FREE Web & Mobile Projects PDF with 20+ project ideas:\n\n{link}\n\nStart building your final year project today! 💪',
    description: 'React, Flutter, full-stack development, responsive designs'
  },
  'Cybersecurity & Blockchain': {
    slug: 'cybersecurity-blockchain',
    pdfPath: '/pdfs/blockchain-projects.pdf',
    whatsappMessage: 'Hi {name}! 🚀\n\nGet your FREE Blockchain Projects PDF with 20+ project ideas:\n\n{link}\n\nStart building your final year project today! 💪',
    description: 'Security protocols, encryption, smart contracts, decentralized apps'
  },
  'Data Science & Analytics': {
    slug: 'data-science-analytics',
    pdfPath: '/pdfs/data-science-projects.pdf',
    whatsappMessage: 'Hi {name}! 🚀\n\nGet your FREE Data Science Projects PDF with 20+ project ideas:\n\n{link}\n\nStart building your final year project today! 💪',
    description: 'Big data processing, visualization, statistical analysis, insights'
  },
  'Networking & Communication': {
    slug: 'networking-communication',
    pdfPath: '/pdfs/networking-projects.pdf',
    whatsappMessage: 'Hi {name}! 🚀\n\nGet your FREE Networking Projects PDF with 20+ project ideas:\n\n{link}\n\nStart building your final year project today! 💪',
    description: 'Network protocols, wireless systems, communication frameworks'
  },
  'Mechanical / ECE Projects': {
    slug: 'mechanical-ece-projects',
    pdfPath: '/pdfs/mechanical-ece-projects.pdf',
    whatsappMessage: 'Hi {name}! 🚀\n\nGet your FREE Mechanical/ECE Projects PDF with 20+ project ideas:\n\n{link}\n\nStart building your final year project today! 💪',
    description: 'Hardware integration, control systems, signal processing'
  }
};

export const getDomainBySlug = (slug: string): DomainConfig | undefined => {
  return Object.values(DOMAINS).find(d => d.slug === slug);
};

export const getDomainByTitle = (title: string): DomainConfig | undefined => {
  return DOMAINS[title];
};

export const getAllDomains = (): Array<{ title: string; config: DomainConfig }> => {
  return Object.entries(DOMAINS).map(([title, config]) => ({ title, config }));
};

