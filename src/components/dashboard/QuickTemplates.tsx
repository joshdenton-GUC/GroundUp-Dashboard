
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const templates = [
  {
    id: 1,
    title: "Construction Manager",
    description: "Template for senior construction management positions",
    category: "Management",
    usageCount: 15
  },
  {
    id: 2,
    title: "Site Supervisor",
    description: "Standard template for site supervision roles",
    category: "Supervision",
    usageCount: 23
  },
  {
    id: 3,
    title: "Safety Inspector",
    description: "Template for safety and compliance positions",
    category: "Safety",
    usageCount: 8
  },
  {
    id: 4,
    title: "Project Engineer",
    description: "Engineering position template with technical requirements",
    category: "Engineering",
    usageCount: 12
  },
  {
    id: 5,
    title: "Skilled Tradesperson",
    description: "General template for skilled trade positions",
    category: "Trades",
    usageCount: 31
  },
  {
    id: 6,
    title: "Equipment Operator",
    description: "Template for heavy equipment operator roles",
    category: "Operations",
    usageCount: 19
  }
];

export function QuickTemplates() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-2xl font-semibold">Quick Templates</h2>
        <Button className="bg-orange-600 hover:bg-orange-700">
          Create Template
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="bg-slate-800 border-slate-700 hover:border-orange-600 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white">{template.title}</CardTitle>
                  <CardDescription className="text-slate-400 mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <span className="bg-orange-900 text-orange-300 px-2 py-1 rounded text-xs">
                  {template.category}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">
                  Used {template.usageCount} times
                </span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    Preview
                  </Button>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    Use Template
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
