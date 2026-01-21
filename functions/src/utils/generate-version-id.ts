/**
 * Generates a unique version ID based on the current timestamp, stripping out all non-numeric characters.
 * @return {string} The version ID as a string of numbers.
 */
export const generateVersionId = () => {
  // Return a timestamp, without any non-numeric characters from the ISO string
  const now = new Date().toISOString().replace(/\D/g, "");
  return now;
};
