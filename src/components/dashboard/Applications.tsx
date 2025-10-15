
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const mockApplications = [
  {
    id: 1,
    candidateName: "Sarah Johnson",
    position: "Senior Construction Manager",
    appliedDate: "2024-01-15",
    status: "Under Review",
    experience: "8 years",
    location: "New York, NY"
  },
  {
    id: 2,
    candidateName: "Mike Rodriguez",
    position: "Project Supervisor",
    appliedDate: "2024-01-14",
    status: "Interview Scheduled",
    experience: "5 years",
    location: "Brooklyn, NY"
  },
  {
    id: 3,
    candidateName: "David Chen",
    position: "Site Engineer",
    appliedDate: "2024-01-13",
    status: "Pending Review",
    experience: "3 years",
    location: "Queens, NY"
  }
];

export function Applications() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-2xl font-semibold">Applications</h2>
        <div className="flex space-x-2">
          <Input 
            placeholder="Search applications..."
            className="w-80 bg-slate-800 border-slate-600 text-white"
          />
          <Button variant="outline" className="border-slate-600 text-slate-300">
            Filter
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4">
        {mockApplications.map((application) => (
          <Card key={application.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {application.candidateName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{application.candidateName}</h3>
                    <p className="text-slate-400">{application.position}</p>
                    <div className="flex space-x-4 text-sm text-slate-500 mt-1">
                      <span>📍 {application.location}</span>
                      <span>⏱ {application.experience} experience</span>
                      <span>📅 Applied {application.appliedDate}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    application.status === 'Under Review' ? 'bg-yellow-900 text-yellow-300' :
                    application.status === 'Interview Scheduled' ? 'bg-blue-900 text-blue-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {application.status}
                  </span>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    View Profile
                  </Button>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
