import React, { useRef, useState } from 'react';

interface FileUploadProps {
  label: string;
  onFileUpload: (content: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onFileUpload }) => {
  const [fileName, setFileName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileUpload(content);
      };
      reader.readAsText(file);
    } else {
        setFileName('');
    }
  };
  
  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-md hover:shadow-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
      >
        {label}
      </button>
      {fileName && <p className="text-sm text-gray-400 mt-2 truncate max-w-full px-2">{fileName}</p>}
    </div>
  );
};

export default FileUpload;