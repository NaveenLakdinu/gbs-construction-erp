"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function AddProjectPage() {
  // Form data
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Function to submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setMessage("Project name is required!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, budget: budget ? parseFloat(budget) : 0 }),
      });

      if (res.ok) {
        setMessage("Project successfully saved!");
        setName("");
        setLocation("");
        setBudget("");
        
        // Redirect to projects page after 2 seconds
        setTimeout(() => {
          router.push("/projects");
        }, 2000);
      } else {
        setMessage("Something went wrong!");
      }
    } catch (error) {
      setMessage("Network error occurred!");
    }
    
    setLoading(false);
  };

  // Function to close and return to projects page
  const handleClose = () => {
    router.push("/projects");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white dark:bg-gray-900 min-h-screen text-black dark:text-white">
      {/* --- Form Section --- */}
      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/workers"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M12 12L3 12M12 8L3 8M12 4L3 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Workers
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Add New Project</h1>
            <ThemeToggle />
          </div>
        </div>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${message.includes("successfully") ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300" : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Project Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter project name"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Location:</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project location"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Project Budget:</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project budget (LKR)"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {loading ? "Adding..." : "Add Project"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}