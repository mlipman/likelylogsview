interface CloudinaryUrls {
  srcUrl: string;
  blurUrl: string;
}

const baseUrl = "https://res.cloudinary.com/dllptigzk/image/upload";

export const getCloudinaryUrls = (picId: string): CloudinaryUrls => {
  return {
    srcUrl: `${baseUrl}/${picId}`,
    blurUrl: `${baseUrl}/w_50,e_blur:100/${picId}`,
  };
};

export const pathFromUploadUrl = (uploadUrl: string | null): string | null =>
  uploadUrl?.startsWith(baseUrl) ? uploadUrl.slice(baseUrl.length) : null;
