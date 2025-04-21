import { Input } from "@/components/ui/input";
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { useDropzone } from "react-dropzone";
import { ArrowLeft, File as FileIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";

interface CreateProjectDropzoneProps {
  onFileUpload: (acceptedFiles: File[]) => void;
}

function CreateProjectDropzone(props: CreateProjectDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: props.onFileUpload,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-6 
        transition-colors duration-200 ease-in-out
        flex flex-col items-center justify-center gap-4
        text-center cursor-pointer
        ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-200 dark:border-gray-800 hover:border-primary"
        }
      `}
    >
      <input {...getInputProps()} />

      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3">
        <Upload className="h-6 w-6 text-gray-500 dark:text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {isDragActive ? "Release to upload files" : "Upload your files"}
      </p>
    </div>
  );
}

export interface CreateProjectFormProps extends CreateProjectDropzoneProps {
  title: string;
  description: string;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  files: File[];
  onRemoveFile: (file: File) => void;
  onSubmit: () => void;
  onDashboard: () => void;
}

export default function CreateProjectForm(props: CreateProjectFormProps) {
  const displayFiles = () => {
    return props.files.map((file, index) => {
      return (
        <div
          key={`${file.name}-${index}`}
          className="flex items-center justify-between"
        >
          <div className="flex flex-row items-center space-x-2">
            <FileIcon />
            <span className="text-sm">{file.name}</span>
          </div>
          <div className="flex flex-row items-center space-x-2">
            <span className="text-sm text-gray-500">
              {formatBytes(file.size)}
            </span>
            <X
              className="hover:text-primary/90 cursor-pointer"
              onClick={() => props.onRemoveFile(file)}
            />
          </div>
        </div>
      );
    });
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    props.onSubmit();
  };

  return (
    <div className="flex grow h-full flex-col space-y-5">
      <div
        className="flex items-center space-x-2 cursor-pointer"
        onClick={props.onDashboard}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to dashboard</span>
      </div>
      <h1 className="text-3xl font-medium">New Project</h1>
      <form
        className="w-full max-w-md flex flex-col space-y-5"
        onSubmit={onSubmit}
      >
        <Input
          required
          value={props.title}
          placeholder="Title"
          onChange={(event) => props.setTitle(event.target.value)}
        />
        <Textarea
          placeholder="Description"
          value={props.description}
          onChange={(event) => props.setDescription(event.target.value)}
        />
        <CreateProjectDropzone onFileUpload={props.onFileUpload} />
        {displayFiles()}
        <Button type="submit" className="w-full cursor-pointer">
          Submit
        </Button>
      </form>
    </div>
  );
}
