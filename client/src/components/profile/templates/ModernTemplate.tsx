import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PropertyCard from "@/components/dashboard/PropertyCard";
import { User, Mail, Phone, MapPin, Award, Calendar, Building, Edit, ChevronRight } from "lucide-react";
import { ProfileTemplateProps } from "./index";

export default function ModernTemplate({
  userData,
  listings,
  theme,
  isOwnProfile,
  onEdit
}: ProfileTemplateProps) {
  // Apply theme styles
  const styles = {
    primaryColor: theme.primaryColor,
    backgroundColor: theme.colorMode === 'dark' ? '#0f172a' : '#f8fafc',
    textColor: theme.colorMode === 'dark' ? '#f8fafc' : '#0f172a',
    secondaryTextColor: theme.colorMode === 'dark' ? '#cbd5e1' : '#64748b',
    borderRadius: `${theme.borderRadius}px`,
    fontFamily: theme.fontFamily,
    fontSize: `${theme.fontSize}px`,
  };

  // Custom styling
  const customStyles = {
    container: {
      backgroundColor: styles.backgroundColor,
      color: styles.textColor,
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
    },
    header: {
      backgroundImage: `linear-gradient(to right, ${theme.primaryColor}, ${theme.primaryColor}dd)`,
      color: '#ffffff',
      padding: '3rem 0',
      borderRadius: `${theme.borderRadius}px ${theme.borderRadius}px 0 0`,
    },
    profileImage: {
      width: '140px',
      height: '140px',
      borderRadius: '100%',
      border: '4px solid white',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    },
    card: {
      borderRadius: styles.borderRadius,
      backgroundColor: theme.colorMode === 'dark' ? '#1e293b' : '#ffffff',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: theme.colorMode === 'dark' ? '1px solid #334155' : 'none',
    },
    heading: {
      color: theme.colorMode === 'dark' ? '#f8fafc' : '#0f172a',
      fontWeight: 'bold',
    },
    subheading: {
      color: styles.secondaryTextColor,
    },
    button: {
      backgroundColor: theme.primaryColor,
      color: 'white',
      borderRadius: styles.borderRadius,
    },
    tabList: {
      backgroundColor: theme.colorMode === 'dark' ? '#334155' : '#e2e8f0',
      borderRadius: styles.borderRadius,
    },
    tab: {
      color: styles.secondaryTextColor,
    },
    activeTab: {
      backgroundColor: theme.colorMode === 'dark' ? '#1e293b' : '#ffffff',
      color: theme.primaryColor,
    },
    skillBadge: {
      backgroundColor: `${theme.primaryColor}15`,
      color: theme.primaryColor,
      borderRadius: styles.borderRadius,
      padding: '0.5rem 1rem',
    },
    contactCard: {
      borderLeft: `4px solid ${theme.primaryColor}`,
    },
  };
  
  return (
    <div style={customStyles.container}>
      {/* Header Banner */}
      <div style={customStyles.header}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col md:flex-row items-center mb-6 md:mb-0">
              <img 
                src={userData.profileImage || "/assets/default-profile.svg"} 
                alt={userData.fullName || userData.username} 
                style={customStyles.profileImage}
                className="mb-4 md:mb-0 md:mr-6"
              />
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold mb-1">{userData.fullName || userData.username}</h1>
                <p className="text-white/80">{userData.title || userData.fullName || userData.username || "Real Estate Professional"}</p>
                {userData.location && (
                  <div className="flex items-center justify-center md:justify-start mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{userData.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            {isOwnProfile && onEdit && (
              <Button 
                variant="outline" 
                onClick={onEdit} 
                className="bg-white text-primary-600 hover:bg-white/90"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-8">
          {/* Contact Info Sidebar */}
          <div className="md:col-span-1">
            <Card style={customStyles.card} className="overflow-hidden">
              <CardHeader className="bg-primary-50 dark:bg-primary-900/20">
                <CardTitle style={customStyles.heading}>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  {userData.email && (
                    <li className="flex items-start">
                      <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/30 mr-3">
                        <Mail className="h-5 w-5" style={{ color: theme.primaryColor }} />
                      </div>
                      <div>
                        <span className="block text-sm font-medium" style={customStyles.subheading}>Email</span>
                        <span>{userData.email}</span>
                      </div>
                    </li>
                  )}
                  {userData.phone && (
                    <li className="flex items-start">
                      <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/30 mr-3">
                        <Phone className="h-5 w-5" style={{ color: theme.primaryColor }} />
                      </div>
                      <div>
                        <span className="block text-sm font-medium" style={customStyles.subheading}>Phone</span>
                        <span>{userData.phone}</span>
                      </div>
                    </li>
                  )}
                  {userData.experience && (
                    <li className="flex items-start">
                      <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/30 mr-3">
                        <Calendar className="h-5 w-5" style={{ color: theme.primaryColor }} />
                      </div>
                      <div>
                        <span className="block text-sm font-medium" style={customStyles.subheading}>Experience</span>
                        <span>{userData.experience}</span>
                      </div>
                    </li>
                  )}
                </ul>
                
                {theme.socialLinksEnabled && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium mb-4" style={customStyles.heading}>Connect</h3>
                    <div className="flex space-x-3">
                      <a href="#" className="p-3 rounded-full" style={{ backgroundColor: theme.primaryColor }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                      </a>
                      <a href="#" className="p-3 rounded-full" style={{ backgroundColor: theme.primaryColor }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                      </a>
                      <a href="#" className="p-3 rounded-full" style={{ backgroundColor: theme.primaryColor }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                      </a>
                    </div>
                  </div>
                )}
                
                {theme.contactFormEnabled && (
                  <div className="mt-6">
                    <Button className="w-full" style={customStyles.button}>
                      Contact Me
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {userData.specialties && userData.specialties.length > 0 && (
              <Card style={customStyles.card} className="mt-6">
                <CardHeader>
                  <CardTitle style={customStyles.heading}>Areas of Expertise</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* About Me */}
            {userData.bio && (
              <Card style={customStyles.card}>
                <CardHeader>
                  <CardTitle style={customStyles.heading}>About Me</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={customStyles.subheading}>{userData.bio}</p>
                  
                  {userData.licenses && userData.licenses.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2" style={customStyles.heading}>Licenses & Certifications</h3>
                      <ul className="list-disc list-inside" style={customStyles.subheading}>
                        {userData.licenses.map((license, index) => (
                          <li key={index}>{license}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Featured Listings */}
            <Card style={customStyles.card}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle style={customStyles.heading}>Featured Listings</CardTitle>
                  <CardDescription style={customStyles.subheading}>
                    Properties represented by {isOwnProfile ? "me" : userData.fullName || userData.username}
                  </CardDescription>
                </div>
                {listings && listings.length > 0 && (
                  <Button variant="ghost" className="text-primary-600">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {listings && listings.length > 0 ? (
                  <div className={`grid grid-cols-1 ${theme.featuredListingsLayout === 'grid' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
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
            
            {/* Contact Form */}
            {theme.contactFormEnabled && (
              <Card style={{...customStyles.card, ...customStyles.contactCard}}>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 