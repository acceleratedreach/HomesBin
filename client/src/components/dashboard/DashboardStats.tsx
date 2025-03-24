import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CircleDollarSign, Users, Home, Eye } from "lucide-react";

// Sample data for the dashboard stats and charts
const data = [
  { name: 'Jan', listings: 4, leads: 2 },
  { name: 'Feb', listings: 3, leads: 4 },
  { name: 'Mar', listings: 5, leads: 6 },
  { name: 'Apr', listings: 7, leads: 8 },
  { name: 'May', listings: 6, leads: 9 },
  { name: 'Jun', listings: 8, leads: 12 },
];

const staticStats = [
  {
    title: "Active Listings",
    value: "12",
    icon: <Home className="h-8 w-8 text-primary-600" />,
    description: "Total active property listings",
  },
  {
    title: "Total Leads",
    value: "45",
    icon: <Users className="h-8 w-8 text-primary-600" />,
    description: "Leads generated from your listings",
  },
  {
    title: "Total Views",
    value: "2,874",
    icon: <Eye className="h-8 w-8 text-primary-600" />,
    description: "Views across all your listings",
  },
  {
    title: "Property Value",
    value: "$4.2M",
    icon: <CircleDollarSign className="h-8 w-8 text-primary-600" />,
    description: "Total value of your listings",
  },
];

export default function DashboardStats() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {staticStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className="bg-primary-100 p-3 rounded-full">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="listings" fill="hsl(var(--chart-1))" name="Listings" />
                <Bar dataKey="leads" fill="hsl(var(--chart-2))" name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
