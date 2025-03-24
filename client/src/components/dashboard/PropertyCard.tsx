import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, Share2, Edit, Eye } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Listing } from "@shared/schema";

interface PropertyCardProps {
  listing: Listing;
}

export default function PropertyCard({ listing }: PropertyCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative">
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="object-cover w-full h-48"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400">
            No image available
          </div>
        )}
        <Badge className="absolute top-2 right-2">{listing.status}</Badge>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{listing.title}</CardTitle>
        <p className="text-2xl font-bold text-primary-600">{formatCurrency(listing.price)}</p>
        <p className="text-sm text-gray-500">{listing.address}, {listing.city}, {listing.state} {listing.zipCode}</p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex space-x-4 mb-4">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-sm">{listing.bedrooms} beds</span>
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-sm">{listing.bathrooms} baths</span>
          </div>
          <div className="flex items-center">
            <Square className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-sm">{listing.squareFeet} sq ft</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">
          {listing.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/listings/${listing.id}/edit`}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Link>
        </Button>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
