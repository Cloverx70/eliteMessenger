export const isValidUrl = (text: string) => {
  try {
    const url = new URL(text);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
