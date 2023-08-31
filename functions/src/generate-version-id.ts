export const generateVersionId = () => {
  // Return a timestamp, without any non-numeric characters from the ISO string
  const now = new Date().toISOString().replace(/\D/g, "");
  return now;
};
