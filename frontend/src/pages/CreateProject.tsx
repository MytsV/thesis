"use client";

import CreateProjectForm from "@/components/project/CreateProjectForm";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { getApiUrl } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { CreateProjectData } from "@/lib/types";
import CreateProjectProgress from "@/components/project/CreateProjectProgress";

const MAX_FILES = 3;

export default function CreateProject() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const createProject = async (formData: FormData) => {
    const response = await axios.post(`${getApiUrl()}/projects/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        }
      },
    });
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      toast(`Project created successfully: ${data.id}`);
    },
    onError: (error) => {
      toast.error("Error creating project", { description: error.message });
    },
  });

  const onFileUpload = (acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > MAX_FILES) {
      toast.error("You can only upload up to 3 files.");
      return;
    }
    // TODO: validate file types
    setFiles((prevState) => [...prevState, ...acceptedFiles]);
  };

  const onRemoveFile = (file: File) => {
    setFiles((prevState) => prevState.filter((f) => f.name !== file.name));
  };

  const onSubmit = (data: CreateProjectData) => {
    // TODO: validate data

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    files.forEach((file) => {
      formData.append("files", file);
    });
    mutation.mutate(formData);
  };

  if (mutation.isPending) {
    return <CreateProjectProgress value={uploadProgress} />;
  }

  return (
    <CreateProjectForm
      files={files}
      onRemoveFile={onRemoveFile}
      onSubmit={onSubmit}
      onFileUpload={onFileUpload}
    />
  );
}
