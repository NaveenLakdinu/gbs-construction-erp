"use client";
import { useState, useEffect } from "react";

interface Project {
  id: number;
  name: string;
  location: string | null;
  status: string | null;
}

export default function ProjectsPage() {
  // Form එකට අවශ්‍ය State
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  // Table එකට අවශ්‍ය State
  const [projects, setProjects] = useState<Project[]>([]);
  const [fetching, setFetching] = useState(true);

  // 1. Database එකෙන් දත්ත ගේන Function එක
  const fetchProjects = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
    setFetching(false);
  };

  // පිටුව Load වෙද්දීම දත්ත ටික ගේන්න
  useEffect(() => {
    fetchProjects();
  }, []);

  // 2. Form එක Submit කරන Function එක
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location }),
    });

    if (res.ok) {
      alert("Project එක සාර්ථකව සේව් වුණා!");
      setName("");
      setLocation("");
      fetchProjects(); // අලුතින් සේව් කරපු එක Table එකේ පේන්න Refresh කරනවා
    } else {
      alert("මොකක් හරි වැරදීමක් වුණා!");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white min-h-screen text-black">
      {/* --- පෝරමය (Form Section) --- */}
      <div className="mb-10 p-6 border rounded-lg shadow-sm bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">අලුත් Project එකක් එකතු කරන්න</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Project නම:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded bg-white"
              required
            />
          </div>
          <div>
            <label className="block mb-1">ස්ථානය (Location):</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border rounded bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              {loading ? "සේව් වෙනවා..." : "Project එක සේව් කරන්න"}
            </button>
          </div>
        </form>
      </div>

      <hr className="mb-10" />

      {/* --- වගුව (Table Section) --- */}
      <div className="overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">දැනට පවතින Project ලැයිස්තුව</h2>
        {fetching ? (
          <p>දත්ත පූරණය වෙනවා...</p>
        ) : (
          <table className="w-full text-left border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Project නම</th>
                <th className="p-3 border">ස්ථානය</th>
                <th className="p-3 border">තත්ත්වය</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-3 text-center">දත්ත කිසිවක් නැත.</td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 border">{p.id}</td>
                    <td className="p-3 border font-medium">{p.name}</td>
                    <td className="p-3 border">{p.location || "-"}</td>
                    <td className="p-3 border">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}