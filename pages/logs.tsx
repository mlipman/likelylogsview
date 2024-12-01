import {useState, useEffect, ChangeEvent} from "react";
import Image from "next/image";
import {log} from "@prisma/client";
import {getCloudinaryUrls} from "../utils/imageUtils";

export default function Logs() {
  const [logs, setLogs] = useState<log[]>([]);
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
          setError("Failed to fetch logs");
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
    if (!content) return;

    setUploading(true);
    try {
      const formData = new FormData();
      if (!!selectedImage) {
        formData.append("image", selectedImage);
      }
      formData.append("content", content);

      const response = await fetch("/api/photos", {
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

  const isButtonDisabled = uploading || !content;

  // todo: image environment handle both camera and album
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
            />
          </div>
          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`px-4 py-2 rounded ${
              isButtonDisabled ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {uploading ? "Uploading..." : "Create Log"}
          </button>
        </form>
      </div>

      <h1 className="text-2xl font-bold mb-4">Logs</h1>
      <div className="grid gap-4">
        {logs.map((log) => {
          const imageUrls = log.pic_id1 ? getCloudinaryUrls(log.pic_id1) : null;
          return (
            <div key={log.id} className="border p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500 mb-2">ID: {log.id}</p>
              <p className="font-semibold">Message: {log.contents}</p>
              {imageUrls && (
                <>
                  <Image
                    className="rounded-lg w-[100px] h-[100px]"
                    src={imageUrls.srcUrl}
                    alt="Meal"
                    width={500}
                    height={500}
                    placeholder="blur"
                    blurDataURL={imageUrls.blurUrl}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    path: {log.pic_id1}
                  </p>
                </>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Created: {new Date(log.created_at).toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
