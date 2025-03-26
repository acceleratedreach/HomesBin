// Export all available profile templates
import ProfessionalTemplate from './ProfessionalTemplate';
import ModernTemplate from './ModernTemplate';
import VibrantTemplate from './VibrantTemplate';
import TemplateSelector from './TemplateSelector';
import { Listing } from '@shared/schema';

// Template registry
export const templates = {
  professional: ProfessionalTemplate,
  modern: ModernTemplate,
  vibrant: VibrantTemplate,
};

// Export types
export interface ProfileTemplateProps {
  userData: {
    id?: string;
    username?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    profileImage?: string;
    bio?: string;
    location?: string;
    experience?: string;
    specialties?: string[];
    licenses?: string[];
    title?: string;
  };
  listings?: Listing[];
  theme: {
    primaryColor: string;
    colorMode: 'light' | 'dark';
    fontFamily: string;
    fontSize: number;
    borderRadius: number;
    socialLinksEnabled?: boolean;
    contactFormEnabled?: boolean;
    featuredListingsLayout?: 'list' | 'grid';
  };
  isOwnProfile?: boolean;
  onEdit?: () => void;
}

// Export all available templates
export {
  ProfessionalTemplate,
  ModernTemplate,
  VibrantTemplate,
  TemplateSelector
};

export default templates; 