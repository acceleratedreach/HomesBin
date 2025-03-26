import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import ProfessionalTemplate from './ProfessionalTemplate';
import ModernTemplate from './ModernTemplate';
import VibrantTemplate from './VibrantTemplate';

const TEMPLATE_OPTIONS = [
  { 
    id: 'professional',
    name: 'Professional',
    component: ProfessionalTemplate,
    description: 'Clean and professional layout focused on credentials and listings',
  },
  { 
    id: 'modern',
    name: 'Modern',
    component: ModernTemplate,
    description: 'Modern design with a focus on visuals and user information',
  },
  { 
    id: 'vibrant',
    name: 'Vibrant',
    component: VibrantTemplate,
    description: 'Bold and colorful design with interactive elements',
  }
];

// Generate simple preview thumbnails
const getThumbnailStyles = (templateId: string, theme: any) => {
  const baseStyle = {
    width: '100%',
    aspect: '16/9',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  };

  switch(templateId) {
    case 'professional':
      return {
        ...baseStyle,
        backgroundColor: theme.colorMode === 'dark' ? '#1f2937' : '#ffffff',
        border: `1px solid ${theme.colorMode === 'dark' ? '#374151' : '#e5e7eb'}`,
        header: {
          display: 'flex',
          padding: '8px',
          borderBottom: `1px solid ${theme.colorMode === 'dark' ? '#374151' : '#e5e7eb'}`,
        },
        content: {
          display: 'flex',
          flex: 1,
          padding: '8px',
        },
        sidebar: {
          width: '30%',
          backgroundColor: theme.colorMode === 'dark' ? '#374151' : '#f9fafb',
          borderRadius: '4px',
          marginRight: '8px',
        },
        main: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '8px',
        },
        card: {
          height: '16px',
          backgroundColor: theme.colorMode === 'dark' ? '#4b5563' : '#e5e7eb',
          borderRadius: '2px',
          marginBottom: '4px',
        }
      };
    case 'modern':
      return {
        ...baseStyle,
        backgroundColor: theme.colorMode === 'dark' ? '#0f172a' : '#f8fafc',
        header: {
          height: '40%',
          background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.primaryColor}cc)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '8px',
        },
        content: {
          marginTop: '-20px',
          padding: '0 8px',
          display: 'flex',
          flex: 1,
          gap: '8px',
        },
        avatar: {
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '2px solid white',
          backgroundColor: 'white',
          marginBottom: '8px',
        },
        sidebar: {
          width: '30%',
        },
        card: {
          height: '40px',
          backgroundColor: theme.colorMode === 'dark' ? '#1e293b' : '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '6px',
        },
        main: {
          flex: 1,
        }
      };
    case 'vibrant':
      return {
        ...baseStyle,
        backgroundColor: theme.colorMode === 'dark' ? '#0c0a1d' : '#ffffff',
        header: {
          height: '50%',
          background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.primaryColor}aa 100%)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '8px',
          position: 'relative' as const,
        },
        overlay: {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        },
        avatar: {
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: `3px solid ${theme.primaryColor}`,
          backgroundColor: 'white',
          zIndex: 1,
        },
        content: {
          display: 'flex',
          padding: '8px',
          gap: '8px',
        },
        card: {
          height: '20px',
          backgroundColor: theme.colorMode === 'dark' ? '#1a1633' : '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          marginBottom: '6px',
        }
      };
    default:
      return baseStyle;
  }
};

interface TemplateSelectorProps {
  currentTemplate: string;
  onChange: (templateId: string) => void;
  demoUserData: any;
  demoListings: any[];
  theme: any;
}

export default function TemplateSelector({
  currentTemplate,
  onChange,
  demoUserData,
  demoListings,
  theme
}: TemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(currentTemplate || 'professional');
  
  const handleSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    onChange(templateId);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Choose a Template</h2>
      <p className="text-muted-foreground">
        Select a template that best represents your personal brand and style.
      </p>
      
      <Carousel className="w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto">
        <CarouselContent>
          {TEMPLATE_OPTIONS.map((template) => {
            const thumbnailStyles = getThumbnailStyles(template.id, theme);
            
            return (
              <CarouselItem key={template.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card className={`overflow-hidden transition-all border-2 hover:shadow-md ${
                    selectedTemplateId === template.id 
                      ? 'border-primary' 
                      : 'border-transparent'
                  }`}>
                    <div className="relative">
                      {/* Generated template thumbnail preview */}
                      <div style={thumbnailStyles} className="aspect-video">
                        {template.id === 'professional' && (
                          <>
                            <div style={thumbnailStyles.header}>
                              <div style={{ width: '60%', height: '12px', backgroundColor: theme.colorMode === 'dark' ? '#4b5563' : '#e5e7eb', borderRadius: '2px' }}></div>
                            </div>
                            <div style={thumbnailStyles.content}>
                              <div style={thumbnailStyles.sidebar}></div>
                              <div style={thumbnailStyles.main}>
                                <div style={thumbnailStyles.card}></div>
                                <div style={thumbnailStyles.card}></div>
                                <div style={{ ...thumbnailStyles.card, width: '80%' }}></div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {template.id === 'modern' && (
                          <>
                            <div style={thumbnailStyles.header}>
                              <div style={thumbnailStyles.avatar}></div>
                            </div>
                            <div style={thumbnailStyles.content}>
                              <div style={thumbnailStyles.sidebar}>
                                <div style={thumbnailStyles.card}></div>
                              </div>
                              <div style={thumbnailStyles.main}>
                                <div style={thumbnailStyles.card}></div>
                                <div style={{ ...thumbnailStyles.card, height: '60px' }}></div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {template.id === 'vibrant' && (
                          <>
                            <div style={thumbnailStyles.header}>
                              <div style={thumbnailStyles.overlay}></div>
                              <div style={thumbnailStyles.avatar}></div>
                            </div>
                            <div style={thumbnailStyles.content}>
                              <div style={{ flex: 1 }}>
                                <div style={thumbnailStyles.card}></div>
                                <div style={thumbnailStyles.card}></div>
                                <div style={{ ...thumbnailStyles.card, width: '70%' }}></div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {selectedTemplateId === template.id && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                      <Button 
                        variant={selectedTemplateId === template.id ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleSelect(template.id)}
                      >
                        {selectedTemplateId === template.id ? 'Selected' : 'Select Template'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <div className="flex justify-center gap-2 mt-4">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </Carousel>
      
      <div className="mt-10 border rounded-lg overflow-hidden bg-muted/30">
        <div className="p-4 bg-muted">
          <h3 className="font-medium">Template Preview</h3>
        </div>
        <div className="border-t p-1 max-h-[600px] overflow-y-auto">
          <div className="transform scale-[0.7] origin-top">
            {selectedTemplateId === 'professional' && (
              <ProfessionalTemplate 
                userData={demoUserData}
                listings={demoListings}
                theme={theme}
                isOwnProfile={true}
              />
            )}
            {selectedTemplateId === 'modern' && (
              <ModernTemplate 
                userData={demoUserData}
                listings={demoListings}
                theme={theme}
                isOwnProfile={true}
              />
            )}
            {selectedTemplateId === 'vibrant' && (
              <VibrantTemplate 
                userData={demoUserData}
                listings={demoListings}
                theme={theme}
                isOwnProfile={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 