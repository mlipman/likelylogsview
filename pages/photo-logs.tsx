import {useState, useEffect, ChangeEvent} from "react";
import Image from "next/image";
import {photo_log} from "@prisma/client";
import {getCloudinaryUrls} from "../utils/imageUtils";

export default function PhotoLogs() {
  const [photoLogs, setPhotoLogs] = useState<photo_log[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [location, setLocation] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotoLogs();
  }, []);

  const fetchPhotoLogs = async () => {
    try {
      const response = await fetch("/api/photo-logs");
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to fetch photo logs");
        setPhotoLogs([]);
      } else {
        setPhotoLogs(data);
      }
    } catch (error) {
      console.error("Error fetching photo logs:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch photo logs");
      setPhotoLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedImage) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("title", title);
      if (description) formData.append("description", description);
      if (tags) formData.append("tags", tags);
      if (location) formData.append("location", location);

      const response = await fetch("/api/photo-logs", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const newPhotoLog = await response.json();
      setPhotoLogs((prev) => [newPhotoLog, ...prev]);

      // Reset form
      setTitle("");
      setDescription("");
      setTags("");
      setLocation("");
      setSelectedImage(null);
      setPreviewUrl(null);
      if (document.getElementById("photoInput")) {
        (document.getElementById("photoInput") as HTMLInputElement).value = "";
      }
    } catch (error) {
      console.error("Error creating photo log:", error);
      setError(error instanceof Error ? error.message : "Failed to create photo log");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  const isButtonDisabled = uploading || !title || !selectedImage;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Photo Logs</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="mb-8 p-6 bg-white border rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Add New Photo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="Give your photo a title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Add a description (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., sunset, landscape, travel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Where was this taken?"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Photo *</label>
            <input
              id="photoInput"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="w-full p-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {previewUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <img
                src={previewUrl}
                alt="Preview"
                className="rounded-lg max-h-64 object-contain"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              isButtonDisabled 
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Your Photos</h2>
        {photoLogs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No photos yet. Add your first photo above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photoLogs.map((log) => {
              const imageUrls = getCloudinaryUrls(log.pic_id);
              return (
                <div key={log.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-64">
                    <Image
                      src={imageUrls.srcUrl}
                      alt={log.title}
                      fill
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL={imageUrls.blurUrl}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{log.title}</h3>
                    {log.description && (
                      <p className="text-gray-600 text-sm mb-2">{log.description}</p>
                    )}
                    <div className="space-y-1 text-sm">
                      {log.tags && (
                        <p className="text-gray-500">
                          <span className="font-medium">Tags:</span> {log.tags}
                        </p>
                      )}
                      {log.location && (
                        <p className="text-gray-500">
                          <span className="font-medium">Location:</span> {log.location}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}