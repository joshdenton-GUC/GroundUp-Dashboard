
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Analytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-white text-2xl font-semibold">Analytics & Reports</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Active Jobs</CardDescription>
            <CardTitle className="text-3xl text-white">12</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-400">+2 from last month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Total Applications</CardDescription>
            <CardTitle className="text-3xl text-white">186</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-400">+23% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Interviews Scheduled</CardDescription>
            <CardTitle className="text-3xl text-white">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-400">This week</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Positions Filled</CardDescription>
            <CardTitle className="text-3xl text-white">5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-400">This month</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Application Trends</CardTitle>
            <CardDescription className="text-slate-400">
              Application volume over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-slate-400">Chart placeholder - Application trends</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Top Performing Jobs</CardTitle>
            <CardDescription className="text-slate-400">
              Jobs with the most applications this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Senior Project Manager", applications: 42 },
                { title: "Site Supervisor", applications: 38 },
                { title: "Construction Worker", applications: 35 },
                { title: "Safety Coordinator", applications: 29 }
              ].map((job, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-white">{job.title}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${(job.applications / 42) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-slate-400 text-sm w-8">{job.applications}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
