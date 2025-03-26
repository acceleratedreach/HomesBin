import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PropertyCard from "@/components/dashboard/PropertyCard";
import { User, Mail, Phone, MapPin, Award, Calendar, Building, Edit, MessageSquare, Heart, Home } from "lucide-react";
import { ProfileTemplateProps } from "./index";

export default function VibrantTemplate({
  userData,
  listings,
  theme,
  isOwnProfile,
  onEdit
}: ProfileTemplateProps) {
  // Apply theme styles
  const styles = {
    primaryColor: theme.primaryColor,
    backgroundColor: theme.colorMode === 'dark' ? '#0c0a1d' : '#ffffff',
    textColor: theme.colorMode === 'dark' ? '#f8fafc' : '#0f172a',
    secondaryTextColor: theme.colorMode === 'dark' ? '#cbd5e1' : '#64748b',
    borderRadius: `${theme.borderRadius}px`,
    fontFamily: theme.fontFamily,
    fontSize: `${theme.fontSize}px`,
  };

  // Generate color palette based on primary color
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const rgb = hexToRgb(theme.primaryColor);
  const gradientStart = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
  const gradientEnd = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`;
  const gradientOverlay = theme.colorMode === 'dark' 
    ? 'linear-gradient(135deg, rgba(12, 10, 29, 0.8) 0%, rgba(12, 10, 29, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.2) 100%)';
  
  // Custom styling with vibrant accents
  const customStyles = {
    container: {
      backgroundColor: styles.backgroundColor,
      color: styles.textColor,
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      minHeight: '100vh',
    },
    header: {
      background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
      position: 'relative' as const,
      overflow: 'hidden',
      padding: '4rem 0 6rem',
      borderRadius: '0',
    },
    headerOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: gradientOverlay,
      zIndex: 1,
    },
    headerContent: {
      position: 'relative' as const,
      zIndex: 2,
    },
    profileImage: {
      width: '160px',
      height: '160px',
      borderRadius: '50%',
      border: `5px solid ${theme.primaryColor}`,
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
      background: '#ffffff',
    },
    card: {
      borderRadius: styles.borderRadius,
      backgroundColor: theme.colorMode === 'dark' ? '#1a1633' : '#ffffff',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      border: 'none',
      overflow: 'hidden',
    },
    heading: {
      color: theme.colorMode === 'dark' ? '#f8fafc' : '#0f172a',
      fontWeight: 'bold',
    },
    subheading: {
      color: styles.secondaryTextColor,
    },
    button: {
      background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
      color: 'white',
      borderRadius: styles.borderRadius,
      border: 'none',
      fontWeight: 'bold',
      transition: 'all 0.3s ease',
    },
    accentBorder: {
      borderTop: `6px solid ${theme.primaryColor}`,
    },
    skillBadge: {
      background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
      color: 'white',
      borderRadius: '30px',
      padding: '0.5rem 1.2rem',
      fontWeight: 'bold',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    iconWrapper: {
      backgroundColor: `${theme.primaryColor}25`,
      color: theme.primaryColor,
      borderRadius: '50%',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '16px',
    },
    tabList: {
      backgroundColor: theme.colorMode === 'dark' ? '#2d2a4a' : '#f1f5f9',
      borderRadius: '30px',
      padding: '4px',
    },
    tab: {
      borderRadius: '30px',
      color: styles.secondaryTextColor,
    },
    activeTab: {
      backgroundColor: theme.primaryColor,
      color: 'white',
      fontWeight: 'bold',
    },
    listingCard: {
      borderRadius: styles.borderRadius,
      overflow: 'hidden',
      transition: 'transform 0.3s ease',
      cursor: 'pointer',
      ':hover': {
        transform: 'translateY(-5px)',
      },
    },
    statCard: {
      padding: '1.5rem',
      textAlign: 'center' as const,
      borderRadius: styles.borderRadius,
      background: theme.colorMode === 'dark' ? 'rgba(26, 22, 51, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: theme.colorMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
    },
    cardPulse: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    // Custom animation for shape effect
    shape: {
      position: 'absolute',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.1)',
      animation: 'float 8s infinite ease-in-out',
    },
  };

  return (
    <div style={customStyles.container}>
      {/* Decorative Shapes for Header */}
      <div style={{
        position: 'absolute' as const,
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        zIndex: 0,
      }}></div>
      <div style={{
        position: 'absolute' as const,
        bottom: '5%',
        right: '10%',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        zIndex: 0,
      }}></div>
      
      {/* Header Banner */}
      <div style={customStyles.header}>
        <div style={customStyles.headerOverlay}></div>
        <div style={customStyles.headerContent}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <img 
                src={userData.profileImage || "/assets/default-profile.jpg"} 
                alt={userData.fullName || userData.username} 
                style={customStyles.profileImage}
                className="mb-6"
              />
              <h1 className="text-4xl font-bold mb-2 text-white">{userData.fullName || userData.username}</h1>
              <p className="text-white text-xl mb-3 opacity-90">{userData.title || userData.fullName || userData.username || "Real Estate Professional"}</p>
              
              {userData.location && (
                <div className="flex items-center justify-center mb-5 text-white/80">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{userData.location}</span>
                </div>
              )}
              
              {isOwnProfile && onEdit && (
                <Button 
                  variant="outline" 
                  onClick={onEdit} 
                  className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Your Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div style={customStyles.statCard}>
            <div style={{
              ...customStyles.iconWrapper,
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem',
              backgroundColor: `${theme.primaryColor}20`,
            }}>
              <Building className="h-7 w-7" />
            </div>
            <h3 className="text-3xl font-bold mb-1" style={customStyles.heading}>
              {listings ? listings.length : 0}
            </h3>
            <p style={customStyles.subheading}>Active Listings</p>
          </div>
          
          {userData.experience && (
            <div style={customStyles.statCard}>
              <div style={{
                ...customStyles.iconWrapper,
                width: '64px',
                height: '64px',
                margin: '0 auto 1rem',
                backgroundColor: `${theme.primaryColor}20`,
              }}>
                <Calendar className="h-7 w-7" />
              </div>
              <h3 className="text-3xl font-bold mb-1" style={customStyles.heading}>
                {userData.experience}
              </h3>
              <p style={customStyles.subheading}>Years Experience</p>
            </div>
          )}
          
          <div style={customStyles.statCard}>
            <div style={{
              ...customStyles.iconWrapper,
              width: '64px',
              height: '64px',
              margin: '0 auto 1rem',
              backgroundColor: `${theme.primaryColor}20`,
            }}>
              <Heart className="h-7 w-7" />
            </div>
            <h3 className="text-3xl font-bold mb-1" style={customStyles.heading}>
              100%
            </h3>
            <p style={customStyles.subheading}>Client Satisfaction</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column - About & Contact */}
          <div className="lg:col-span-1">
            {/* About Card */}
            {userData.bio && (
              <Card style={{...customStyles.card, ...customStyles.accentBorder}} className="mb-8">
                <CardHeader className="pb-2">
                  <div className="flex items-center mb-2">
                    <div style={customStyles.iconWrapper}>
                      <User className="h-5 w-5" />
                    </div>
                    <CardTitle style={customStyles.heading}>About Me</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p style={customStyles.subheading} className="mb-4">
                    {userData.bio}
                  </p>
                  
                  {userData.specialties && userData.specialties.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-md font-semibold mb-3" style={customStyles.heading}>Areas of Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {userData.specialties.map((specialty, index) => (
                          <span 
                            key={index} 
                            style={customStyles.skillBadge}
                            className="inline-block text-sm"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Contact Card */}
            <Card style={customStyles.card} className="mb-8">
              <CardHeader className="pb-2">
                <div className="flex items-center mb-2">
                  <div style={customStyles.iconWrapper}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <CardTitle style={customStyles.heading}>Contact Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {userData.email && (
                    <li className="flex items-center">
                      <Mail className="h-5 w-5 mr-3" style={{ color: theme.primaryColor }} />
                      <span>{userData.email}</span>
                    </li>
                  )}
                  {userData.phone && (
                    <li className="flex items-center">
                      <Phone className="h-5 w-5 mr-3" style={{ color: theme.primaryColor }} />
                      <span>{userData.phone}</span>
                    </li>
                  )}
                  {userData.location && (
                    <li className="flex items-center">
                      <MapPin className="h-5 w-5 mr-3" style={{ color: theme.primaryColor }} />
                      <span>{userData.location}</span>
                    </li>
                  )}
                </ul>
                
                {theme.socialLinksEnabled && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-semibold mb-4" style={customStyles.heading}>Connect With Me</h3>
                    <div className="flex space-x-3">
                      <a 
                        href="#" 
                        className="p-3 rounded-full" 
                        style={{ 
                          background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                      </a>
                      <a 
                        href="#" 
                        className="p-3 rounded-full" 
                        style={{ 
                          background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                      </a>
                      <a 
                        href="#" 
                        className="p-3 rounded-full" 
                        style={{ 
                          background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                      </a>
                    </div>
                  </div>
                )}
                
                {theme.contactFormEnabled && (
                  <div className="mt-6">
                    <Button className="w-full" style={customStyles.button}>
                      Send Message
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Listings & Credentials */}
          <div className="lg:col-span-2">
            {/* Tabs for Content */}
            <Tabs defaultValue="listings" className="w-full">
              <TabsList style={customStyles.tabList} className="mb-8 grid grid-cols-3 w-full max-w-md mx-auto">
                <TabsTrigger 
                  value="listings" 
                  style={customStyles.tab}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Listings
                </TabsTrigger>
                <TabsTrigger 
                  value="credentials" 
                  style={customStyles.tab}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Credentials
                </TabsTrigger>
                <TabsTrigger 
                  value="contact" 
                  style={customStyles.tab}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact
                </TabsTrigger>
              </TabsList>
              
              {/* Listings Tab */}
              <TabsContent value="listings" className="mt-0">
                <Card style={customStyles.card}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle style={customStyles.heading}>Featured Listings</CardTitle>
                      {listings && listings.length > 0 && (
                        <Button variant="outline" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
                          View All
                        </Button>
                      )}
                    </div>
                    <CardDescription style={customStyles.subheading}>
                      Properties currently represented by {isOwnProfile ? "me" : userData.fullName || userData.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {listings && listings.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {listings.slice(0, 4).map((listing) => (
                          <PropertyCard
                            key={listing.id}
                            listing={listing}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <Building className="mx-auto h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-medium mb-2" style={customStyles.heading}>No listings available</h3>
                        <p style={customStyles.subheading}>
                          {isOwnProfile 
                            ? "You haven't added any listings yet" 
                            : `${userData.fullName || userData.username} hasn't added any listings yet`}
                        </p>
                        {isOwnProfile && (
                          <Button className="mt-4" style={customStyles.button}>
                            Add Your First Listing
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Credentials Tab */}
              <TabsContent value="credentials" className="mt-0">
                <Card style={customStyles.card}>
                  <CardHeader>
                    <CardTitle style={customStyles.heading}>Professional Credentials</CardTitle>
                    <CardDescription style={customStyles.subheading}>
                      Licenses, certifications, and professional achievements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userData.licenses && userData.licenses.length > 0 ? (
                      <div className="space-y-6">
                        {userData.licenses.map((license, index) => (
                          <div key={index} className="flex items-start">
                            <div style={{
                              ...customStyles.iconWrapper,
                              minWidth: '44px',
                              height: '44px',
                            }}>
                              <Award className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium" style={customStyles.heading}>{license}</h4>
                              <p style={customStyles.subheading}>Valid license</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <Award className="mx-auto h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-medium mb-2" style={customStyles.heading}>No credentials listed</h3>
                        <p style={customStyles.subheading}>
                          {isOwnProfile 
                            ? "You haven't added any professional credentials yet" 
                            : `${userData.fullName || userData.username} hasn't added any credentials yet`}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Contact Tab */}
              <TabsContent value="contact" className="mt-0">
                {theme.contactFormEnabled ? (
                  <Card style={customStyles.card}>
                    <CardHeader>
                      <CardTitle style={customStyles.heading}>Send a Message</CardTitle>
                      <CardDescription style={customStyles.subheading}>
                        Get in touch with {isOwnProfile ? "me" : userData.fullName || userData.username}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1" style={customStyles.subheading}>Name</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-2 border rounded-md" 
                              style={{ 
                                borderColor: theme.colorMode === 'dark' ? '#475569' : '#e2e8f0',
                                borderRadius: styles.borderRadius,
                                backgroundColor: theme.colorMode === 'dark' ? '#1e293b' : '#ffffff',
                                color: styles.textColor
                              }}
                              placeholder="Your name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1" style={customStyles.subheading}>Email</label>
                            <input 
                              type="email" 
                              className="w-full px-4 py-2 border rounded-md" 
                              style={{ 
                                borderColor: theme.colorMode === 'dark' ? '#475569' : '#e2e8f0',
                                borderRadius: styles.borderRadius,
                                backgroundColor: theme.colorMode === 'dark' ? '#1e293b' : '#ffffff',
                                color: styles.textColor
                              }}
                              placeholder="Your email"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={customStyles.subheading}>Message</label>
                          <textarea 
                            className="w-full px-4 py-2 border rounded-md" 
                            style={{ 
                              borderColor: theme.colorMode === 'dark' ? '#475569' : '#e2e8f0',
                              borderRadius: styles.borderRadius,
                              backgroundColor: theme.colorMode === 'dark' ? '#1e293b' : '#ffffff',
                              color: styles.textColor
                            }}
                            rows={4}
                            placeholder="Your message"
                          ></textarea>
                        </div>
                        <Button style={customStyles.button}>
                          Send Message
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card style={customStyles.card}>
                    <CardContent className="text-center py-10">
                      <MessageSquare className="mx-auto h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-lg font-medium mb-2" style={customStyles.heading}>Contact options</h3>
                      <p style={customStyles.subheading} className="mb-6">
                        You can reach {isOwnProfile ? "me" : userData.fullName || userData.username} through the contact information provided
                      </p>
                      {userData.email && (
                        <Button className="mx-auto" style={customStyles.button}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
} 