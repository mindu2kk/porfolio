export interface UserHandles {
  all: string;
  discordId: string;
  linkedin?: string;
  [key: string]: string | undefined;
}

export const USER_HANDLES: UserHandles = {
  all: 'DuMin',
  discordId: '1195303714777468988',
  linkedin: 'nirussvn0',
};

export interface SocialLink {
  name: string;
  urlTemplate: string;
  handleKey: keyof UserHandles;
  icon: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'Facebook',
    urlTemplate: 'https://www.facebook.com/fervencyy',
    handleKey: 'all',
    icon: 'facebook',
  },
  {
    name: 'Instagram',
    urlTemplate: 'https://www.instagram.com/_fervency._/',
    handleKey: 'all',
    icon: 'instagram',
  },
  {
    name: 'GitHub',
    urlTemplate: 'https://github.com/mindu2kk',
    handleKey: 'all',
    icon: 'github',
  },
  {
    name: 'LinkedIn',
    urlTemplate: 'https://www.linkedin.com/in/phan-minh-duc/',
    handleKey: 'all',
    icon: 'linkedin',
  },
];

export interface ConnectLink {
  name: string;
  handle: string;
  urlTemplate: string;
  handleKey: keyof UserHandles;
}

export const CONNECT_LINKS: ConnectLink[] = [
  {
    name: 'GitHub',
    handle: 'DuMinh',
    urlTemplate: 'https://github.com/mindu2kk',
    handleKey: 'all',
  },
  {
    name: 'LinkedIn',
    handle: 'DuMinh',
    urlTemplate: 'https://www.linkedin.com/in/phan-minh-duc/',
    handleKey: 'linkedin',
  },
];

export const generateSocialUrl = (urlTemplate: string, handle: string): string =>
  urlTemplate.replace('{handle}', handle);

export const generateConnectUrl = (urlTemplate: string, handle: string): string =>
  urlTemplate.replace('{handle}', handle);
