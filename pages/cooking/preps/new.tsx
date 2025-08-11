import {useState, useEffect} from "react";
import {useRouter} from "next/router";
import Link from "next/link";

interface Week {
  id: number;
  year: number;
  week: number;
}

interface Project {
  id: number;
  title: string;
  content_md: string | null;
  source: string | null;
  url: string | null;
}

export default function NewPrep() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    week_id: "",
    project_id: "",
    plan_md: "",
  });
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weeksResponse, projectsResponse] = await Promise.all([
          fetch("/api/cooking/weeks"),
          fetch("/api/cooking/projects"),
        ]);

        const weeksData = await weeksResponse.json();
        const projectsData = await projectsResponse.json();

        setWeeks(weeksData);
        setProjects(projectsData);

        // Auto-select current week if available
        const currentWeek = getCurrentWeek();
        const matchingWeek = weeksData.find((w: Week) => 
          w.year === currentWeek.year && w.week === currentWeek.week
        );
        
        if (matchingWeek) {
          setFormData(prev => ({
            ...prev,
            week_id: matchingWeek.id.toString(),
          }));
        } else if (weeksData.length > 0) {
          setFormData(prev => ({
            ...prev,
            week_id: weeksData[0].id.toString(),
          }));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCurrentWeek = (): {year: number; week: number} => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    let targetDate = new Date(now);
    if (dayOfWeek === 0) {
      targetDate.setDate(now.getDate() + 1);
    } else if (dayOfWeek === 6) {
      targetDate.setDate(now.getDate() + 2);
    }
    
    const getISOWeek = (date: Date) => {
      const tempDate = new Date(date.getTime());
      tempDate.setHours(0, 0, 0, 0);
      tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
      const yearStart = new Date(tempDate.getFullYear(), 0, 1);
      const weekNo = Math.ceil(((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      return {year: tempDate.getFullYear(), week: weekNo};
    };
    
    return getISOWeek(targetDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        week_id: parseInt(formData.week_id),
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
        plan_md: formData.plan_md || null,
      };

      const response = await fetch("/api/cooking/preps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/cooking/preps");
      } else {
        console.error("Failed to create prep");
      }
    } catch (error) {
      console.error("Error creating prep:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const {name, value} = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const selectedProject = projects.find(p => p.id.toString() === formData.project_id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan New Prep</h1>
          <p className="text-gray-600">Create a new meal prep session</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="week_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Week <span className="text-red-500">*</span>
                </label>
                <select
                  id="week_id"
                  name="week_id"
                  value={formData.week_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a week</option>
                  {weeks.map(week => (
                    <option key={week.id} value={week.id}>
                      {week.year} - Week {week.week}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="project_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project (Optional)
                </label>
                <select
                  id="project_id"
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">No project / Custom prep</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedProject && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">
                Selected Project: {selectedProject.title}
              </h3>
              {selectedProject.source && (
                <p className="text-sm text-orange-700 mb-2">
                  Source: {selectedProject.source}
                </p>
              )}
              {selectedProject.url && (
                <a
                  href={selectedProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-600 hover:text-orange-800 underline mb-2 block"
                >
                  View Original Project
                </a>
              )}
              {selectedProject.content_md && (
                <div className="bg-white rounded p-3 mt-3">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {selectedProject.content_md}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Prep Plan & Notes
            </h2>

            <div>
              <label
                htmlFor="plan_md"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Plan Details
              </label>
              <textarea
                id="plan_md"
                name="plan_md"
                value={formData.plan_md}
                onChange={handleInputChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder={
                  selectedProject
                    ? "Any modifications to the project, shopping list, timing considerations, storage notes..."
                    : "Describe what you plan to prep, ingredients needed, techniques, timing, storage instructions..."
                }
              />
              <p className="text-sm text-gray-500 mt-1">
                You can use markdown formatting here. This will help you plan your prep approach.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Link href="/cooking/preps" className="px-4 py-2 text-gray-600 hover:text-gray-800">
              ← Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !formData.week_id}
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Prep Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}