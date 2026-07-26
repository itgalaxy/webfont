export const formatCliFlagDescription = (description: string | readonly string[]): string => {
  if (typeof description === "string") {
    return description;
  }

  return description.join("\n");
};
