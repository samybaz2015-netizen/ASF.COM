// utils/DriveImage.js
export const toDirectDriveImageUrl = (url) => {
  if (!url) return url;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    const fileId = match[1];
    // sz=w1000 بيدي جودة كويسة، تقدر تكبرها لو محتاج
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  return url;
};