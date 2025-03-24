import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  iconColor?: string;
}

export default function FeatureCard({ icon, title, description, iconColor = "text-primary-600" }: FeatureCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className={`bg-primary-100 p-3 rounded-full inline-block mb-4`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-2 text-base text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
}
