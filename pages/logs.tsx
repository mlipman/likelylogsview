import {useState, useEffect, ChangeEvent} from "react";
import {Log} from "@prisma/client";

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs");
      const data = await response.json();
      if (!response.ok) {
        if (data.error) {
          setError(data.error);
        } else {
          setError(
            error instanceof Error ? error.message : "Failed to fetch logs"
          );
        }
        setLogs([]);
        setLoading(false);
      }
      setLogs(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogs([]);
      setLoading(false);
      setError(error instanceof Error ? error.message : "Failed to fetch logs");
    }
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage || !content) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("content", content);

      const response = await fetch("/api/logs", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const newLog = await response.json();
      setLogs((prevLogs) => [newLog, ...prevLogs]);

      // Reset form
      setContent("");
      setSelectedImage(null);
      if (document.getElementById("imageInput")) {
        (document.getElementById("imageInput") as HTMLInputElement).value = "";
      }
    } catch (error) {
      console.error("Error creating log:", error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 p-4 border rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Create New Log</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Content:</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">Image:</label>
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="w-full"
              required
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !selectedImage || !content}
            className={`px-4 py-2 rounded ${
              uploading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {uploading ? "Uploading..." : "Create Log"}
          </button>
        </form>
      </div>

      <h1 className="text-2xl font-bold mb-4">Logs</h1>
      <div className="grid gap-4">
        {logs.map((log) => (
          <div key={log.id} className="border p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500 mb-2">ID: {log.id}</p>
            <p className="font-semibold">Content: {log.contents}</p>
            {log.pic1 && (
              <>
                <img
                  src={log.pic1}
                  alt="Log image"
                  className="mt-2 max-w-sm rounded"
                />
                <p className="text-sm text-gray-500 mt-1">URL: {log.pic1}</p>
              </>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Created: {new Date(log.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
