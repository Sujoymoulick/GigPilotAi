import { LinkedInProvider } from './LinkedInProvider';
import { FacebookProvider } from './FacebookProvider';
import { InstagramProvider } from './InstagramProvider';
import { BlueskyProvider } from './BlueskyProvider';
import { MastodonProvider } from './MastodonProvider';
import { DevtoProvider } from './DevtoProvider';
import type { SocialProvider } from './SocialProvider';

export * from './SocialProvider';
export * from './LinkedInProvider';
export * from './FacebookProvider';
export * from './InstagramProvider';
export * from './BlueskyProvider';
export * from './MastodonProvider';
export * from './DevtoProvider';

export function getSocialProvider(providerName: string): SocialProvider {
  const normalized = providerName.toLowerCase().replace(/\s+/g, '');
  switch (normalized) {
    case 'linkedin':
      return new LinkedInProvider();
    case 'facebook':
    case 'facebookpages':
      return new FacebookProvider();
    case 'instagram':
    case 'instagrambusiness':
      return new InstagramProvider();
    case 'bluesky':
      return new BlueskyProvider();
    case 'mastodon':
      return new MastodonProvider();
    case 'dev.to':
    case 'devto':
      return new DevtoProvider();
    default:
      throw new Error(`Unsupported social provider: ${providerName}`);
  }
}
