export const generateVersionId = () => {
  const now = new Date().toISOString().replace(":", "-").replace(".", "-");
  return now;
};
