import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PropertyCard from "@/components/dashboard/PropertyCard";
import { User, Mail, Phone, MapPin, Award, Calendar, Building, Edit } from "lucide-react";
import { ProfileTemplateProps } from "./index";

export default function ProfessionalTemplate({
  userData,
  listings,
  theme,
  isOwnProfile,
  onEdit
}: ProfileTemplateProps) {
  // Apply theme styles
  const styles = {
    primaryColor: theme.primaryColor,
    backgroundColor: theme.colorMode === 'dark' ? '#1f2937' : '#ffffff',
    textColor: theme.colorMode === 'dark' ? '#f9fafb' : '#111827',
    secondaryTextColor: theme.colorMode === 'dark' ? '#d1d5db' : '#6b7280',
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
    card: {
      borderRadius: styles.borderRadius,
      backgroundColor: theme.colorMode === 'dark' ? '#374151' : '#ffffff',
      boxShadow: theme.colorMode === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.2)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    heading: {
      color: theme.colorMode === 'dark' ? '#f9fafb' : '#111827',
    },
    subheading: {
      color: theme.colorMode === 'dark' ? '#d1d5db' : '#4b5563',
    },
    button: {
      backgroundColor: theme.primaryColor,
      borderRadius: styles.borderRadius,
    },
    profileImage: {
      border: `4px solid ${theme.primaryColor}`,
      borderRadius: '100%',
    },
    tabList: {
      backgroundColor: theme.colorMode === 'dark' ? '#1f2937' : '#f3f4f6',
      borderRadius: styles.borderRadius,
    },
    tab: {
      color: theme.colorMode === 'dark' ? '#d1d5db' : '#4b5563',
    },
    activeTab: {
      backgroundColor: theme.colorMode === 'dark' ? '#374151' : '#ffffff',
      color: theme.primaryColor,
    },
  };
  
  return (
    <div className="space-y-8" style={customStyles.container}>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold" style={customStyles.heading}>
            {isOwnProfile ? "My Profile" : (userData.fullName || userData.username) ? `${userData.fullName || userData.username}'s Profile` : "Profile"}
          </h1>
          {isOwnProfile && onEdit && (
            <Button variant="outline" onClick={onEdit} style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
        
        <Card style={customStyles.card}>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden" style={customStyles.profileImage}>
                    {userData.profileImage ? (
                      <img 
                        src={userData.profileImage} 
                        alt={userData.fullName || userData.username || "Agent profile"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold" style={customStyles.heading}>
                    {userData.fullName || userData.username || "Real Estate Professional"}
                  </h2>
                  <p style={customStyles.subheading}>{userData.title || userData.fullName || userData.username || "Real Estate Professional"}</p>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userData.email && (
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                        <span>{userData.email}</span>
                      </div>
                    )}
                    {userData.phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                        <span>{userData.phone}</span>
                      </div>
                    )}
                    {userData.location && (
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                        <span>{userData.location}</span>
                      </div>
                    )}
                    {userData.experience && (
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                        <span>{userData.experience}</span>
                      </div>
                    )}
                  </div>
                  
                  {userData.bio && (
                    <div>
                      <h3 className="text-lg font-medium mb-2" style={customStyles.heading}>About Me</h3>
                      <p style={customStyles.subheading}>{userData.bio}</p>
                    </div>
                  )}
                  
                  {userData.specialties && userData.specialties.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2" style={customStyles.heading}>Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {userData.specialties.map((specialty, index) => (
                          <span 
                            key={index} 
                            className="px-3 py-1 text-sm rounded-full" 
                            style={{ 
                              backgroundColor: `${theme.primaryColor}25`, 
                              color: theme.primaryColor,
                              borderRadius: styles.borderRadius
                            }}
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userData.licenses && userData.licenses.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2" style={customStyles.heading}>Licenses & Certifications</h3>
                      <ul className="list-disc list-inside" style={customStyles.subheading}>
                        {userData.licenses.map((license, index) => (
                          <li key={index}>{license}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Tabs defaultValue="listings">
          <TabsList className="grid w-full grid-cols-2" style={customStyles.tabList}>
            <TabsTrigger 
              value="listings" 
              style={customStyles.tab}
              className="data-[state=active]:text-primary-600 data-[state=active]:bg-white"
            >
              <Building className="h-4 w-4 mr-2" />
              Listings
            </TabsTrigger>
            <TabsTrigger 
              value="contact" 
              style={customStyles.tab}
              className="data-[state=active]:text-primary-600 data-[state=active]:bg-white"
            >
              <User className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="listings" className="mt-6">
            <Card style={customStyles.card}>
              <CardHeader>
                <CardTitle style={customStyles.heading}>Featured Listings</CardTitle>
                <CardDescription style={customStyles.subheading}>
                  Properties represented by {isOwnProfile ? "me" : userData.fullName || userData.username || "this agent"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {listings && listings.length > 0 ? (
                  <div className={`grid grid-cols-1 ${theme.featuredListingsLayout === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-1'} gap-6`}>
                    {listings.map((listing) => (
                      <PropertyCard
                        key={listing.id}
                        listing={listing}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="mx-auto h-12 w-12 mb-4" style={{ color: theme.primaryColor }} />
                    <h3 className="text-lg font-medium mb-2" style={customStyles.heading}>No listings available</h3>
                    <p style={customStyles.subheading}>
                      {isOwnProfile 
                        ? "You haven't added any listings yet" 
                        : `${userData.fullName || userData.username || "This agent"} hasn't added any listings yet`}
                    </p>
                    {isOwnProfile && (
                      <Button className="mt-4" style={{ backgroundColor: theme.primaryColor }}>
                        Add Your First Listing
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contact" className="mt-6">
            <Card style={customStyles.card}>
              <CardHeader>
                <CardTitle style={customStyles.heading}>Contact Information</CardTitle>
                <CardDescription style={customStyles.subheading}>
                  Get in touch with {isOwnProfile ? "me" : userData.fullName || userData.username || "this agent"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {theme.contactFormEnabled ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium" style={customStyles.heading}>Contact Details</h3>
                      <ul className="space-y-3" style={customStyles.subheading}>
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
                        <div className="mt-6">
                          <h3 className="text-lg font-medium mb-3" style={customStyles.heading}>Social Media</h3>
                          <div className="flex space-x-4">
                            <a href="#" className="p-2 rounded-full" style={{ backgroundColor: `${theme.primaryColor}25` }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            </a>
                            <a href="#" className="p-2 rounded-full" style={{ backgroundColor: `${theme.primaryColor}25` }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                            </a>
                            <a href="#" className="p-2 rounded-full" style={{ backgroundColor: `${theme.primaryColor}25` }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium" style={customStyles.heading}>Send a Message</h3>
                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1" style={customStyles.subheading}>Name</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 border rounded-md" 
                            style={{ 
                              borderColor: `${theme.primaryColor}50`,
                              borderRadius: styles.borderRadius,
                              backgroundColor: theme.colorMode === 'dark' ? '#374151' : '#ffffff',
                              color: styles.textColor
                            }}
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={customStyles.subheading}>Email</label>
                          <input 
                            type="email" 
                            className="w-full px-3 py-2 border rounded-md" 
                            style={{ 
                              borderColor: `${theme.primaryColor}50`,
                              borderRadius: styles.borderRadius,
                              backgroundColor: theme.colorMode === 'dark' ? '#374151' : '#ffffff',
                              color: styles.textColor
                            }}
                            placeholder="Your email"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1" style={customStyles.subheading}>Message</label>
                          <textarea 
                            className="w-full px-3 py-2 border rounded-md" 
                            style={{ 
                              borderColor: `${theme.primaryColor}50`,
                              borderRadius: styles.borderRadius,
                              backgroundColor: theme.colorMode === 'dark' ? '#374151' : '#ffffff',
                              color: styles.textColor
                            }}
                            rows={4}
                            placeholder="Your message"
                          ></textarea>
                        </div>
                        <Button style={{ backgroundColor: theme.primaryColor }}>
                          Send Message
                        </Button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium" style={customStyles.heading}>Contact Details</h3>
                    <ul className="space-y-3" style={customStyles.subheading}>
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 