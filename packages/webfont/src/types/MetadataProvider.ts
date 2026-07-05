export type FileMetadata = {
  name: string;
  unicode?: string | string[];
};

export type MetadataProvider = (
  srcPath: string,
  callback: (error: Error | null, metadata?: FileMetadata) => void,
) => void;
