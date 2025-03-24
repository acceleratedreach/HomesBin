import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bed, 
  Bath, 
  Square, 
  MapPin, 
  Calendar, 
  Tag, 
  Share2, 
  Edit, 
  Trash2 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ListingDetailsProps {
  listingId: number;
}

export default function ListingDetails({ listingId }: ListingDetailsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: listing, isLoading, error } = useQuery({
    queryKey: [`/api/listings/${listingId}`],
  });

  const { mutate: deleteListing } = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      await apiRequest('DELETE', `/api/listings/${listingId}`, {});
    },
    onSuccess: () => {
      setIsDeleting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
      toast({
        title: "Listing deleted",
        description: "Your property listing has been deleted successfully.",
      });
      setLocation('/listings');
    },
    onError: () => {
      setIsDeleting(false);
      toast({
        title: "Error",
        description: "Failed to delete listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading listing details</div>;
  if (!listing) return <div>Listing not found</div>;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <p className="text-gray-500 flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {listing.address}, {listing.city}, {listing.state} {listing.zipCode}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/listings/${listing.id}/edit`}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the listing and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteListing()}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video">
                <img
                  src={listing.images && listing.images.length > 0 ? listing.images[0] : "https://via.placeholder.com/800x500"}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-4 right-4">{listing.status}</Badge>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-primary-600">{formatCurrency(listing.price)}</h2>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center">
                      <Bed className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{listing.bedrooms} Bedrooms</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{listing.bathrooms} Bathrooms</span>
                    </div>
                    <div className="flex items-center">
                      <Square className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{listing.squareFeet} Sq Ft</span>
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{listing.propertyType}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Description</h3>
                  <p className="text-gray-600 whitespace-pre-line">{listing.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Listing Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Listed</span>
                  <span className="font-medium">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {formatDate(listing.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span className="font-medium">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {formatDate(listing.updatedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <Badge variant="outline">{listing.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Property ID</span>
                  <span className="font-medium">#{listing.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-2">Marketing Actions</h3>
              <div className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/social-content">Create Social Post</Link>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/listing-graphics">Generate Graphics</Link>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/email-marketing">Email Marketing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
