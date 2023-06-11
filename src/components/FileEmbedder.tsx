import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
interface FileEmbedderProps {
  handleEmbed: (acceptedFiles: File[]) => void;
}

export const FileEmbedder: React.FC<FileEmbedderProps> = ({ handleEmbed }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleEmbed(acceptedFiles);
      setIsDragActive(false);
    },
    [handleEmbed],
  );

  const { acceptedFiles, getRootProps, getInputProps, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        'application/pdf': ['.pdf'],
        'text/plain': ['.txt', '.md'],
      },
      onDragEnter: () => setIsDragActive(true),
      onDragLeave: () => setIsDragActive(false),
    });

  const acceptedFileItems = acceptedFiles.map((file: any) => (
    <li key={file.name}>
      {file.name} - {file.size} bytes
    </li>
  ));

  return (
    <>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed border-gray-300 p-6 rounded-md cursor-pointer ${
          isDragActive ? 'active' : ''
        } ${isDragReject ? 'reject' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here...</p>
        ) : (
          <p style={{ cursor: 'pointer' }}>Click here or drag and drop file here (PDF, MD, TXT), then press Embed</p>
        )}
      </div>
      <aside>
        <ul>{acceptedFileItems}</ul>
      </aside>
    </>
  );
};