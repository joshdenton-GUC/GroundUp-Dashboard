
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const mockDrafts = [
  {
    id: 1,
    title: "Senior Project Manager",
    lastModified: "2024-01-15",
    completionStatus: "80%",
    department: "Project Management"
  },
  {
    id: 2,
    title: "Electrical Foreman",
    lastModified: "2024-01-14",
    completionStatus: "45%",
    department: "Electrical"
  },
  {
    id: 3,
    title: "Safety Coordinator",
    lastModified: "2024-01-13",
    completionStatus: "90%",
    department: "Safety"
  }
];

export function SavedDrafts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-2xl font-semibold">Saved Drafts</h2>
        <Button className="bg-orange-600 hover:bg-orange-700">
          New Draft
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDrafts.map((draft) => (
          <Card key={draft.id} className="bg-slate-800 border-slate-700 hover:border-orange-600 transition-colors">
            <CardHeader>
              <CardTitle className="text-white">{draft.title}</CardTitle>
              <CardDescription className="text-slate-400">
                {draft.department} • Last modified {draft.lastModified}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Completion</span>
                    <span className="text-white">{draft.completionStatus}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full" 
                      style={{ width: draft.completionStatus }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-600 text-slate-300">
                    Delete
                  </Button>
                  <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700">
                    Continue
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
