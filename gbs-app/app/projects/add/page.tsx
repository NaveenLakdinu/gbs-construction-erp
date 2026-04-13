"use client";
import { useState } from "react";

export default function AddProject() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

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
    } else {
      alert("මොකක් හරි වැරදීමක් වුණා!");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">අලුත් Project එකක් එකතු කරන්න</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Project නම:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded bg-white text-black"
            required
          />
        </div>
        <div>
          <label className="block mb-1">ස්ථානය (Location):</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 border rounded bg-white text-black"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          {loading ? "සේව් වෙනවා..." : "Project එක සේව් කරන්න"}
        </button>
      </form>
    </div>
  );
}