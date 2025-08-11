import {useState} from "react";

interface ImageUploadProps {
  onUpload: (picId: string) => void;
  multiple?: boolean;
  className?: string;
}

export default function ImageUpload({
  onUpload,
  multiple = false,
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = e => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("content", "Cooking result image");

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const picId = data.pic_id1;
        if (picId) {
          onUpload(picId);
        }
      } else {
        console.error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-8 h-8 mb-4 text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> a photo
            </p>
            <p className="text-xs text-gray-500">PNG, JPG or GIF</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && <div className="text-center text-sm text-gray-600">Uploading...</div>}

      {preview && (
        <div className="text-center">
          <img
            src={preview}
            alt="Preview"
            className="max-w-32 max-h-32 mx-auto rounded-lg shadow-md"
          />
        </div>
      )}
    </div>
  );
}
