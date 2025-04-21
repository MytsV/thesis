"use client";

import CreateProjectForm from "@/components/project/CreateProjectForm";
import { useState } from "react";
import { toast } from "sonner";
import { AxiosProgressEvent } from "axios";
import { createProject } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import CreateProjectProgress from "@/components/project/CreateProjectProgress";
import CreateProjectSuccess from "@/components/project/CreateProjectSuccess";
import { useRouter } from "next/navigation";

const MAX_FILES = 3;

export default function CreateProject() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [projectId, setProjectId] = useState<string | null>(null);

  const onUploadProgress = (progressEvent: AxiosProgressEvent) => {
    if (progressEvent.total) {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total,
      );
      setUploadProgress(percentCompleted);
    }
  };

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      setProjectId(data.id);
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

  const onSubmit = () => {
    // TODO: validate data

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    files.forEach((file) => {
      formData.append("files", file);
    });
    mutation.mutate({ formData, onUploadProgress });
  };

  const router = useRouter();

  if (mutation.isPending) {
    return <CreateProjectProgress value={uploadProgress} />;
  }

  if (mutation.isSuccess && projectId) {
    return (
      <CreateProjectSuccess
        projectId={projectId}
        onDashboard={() => {
          router.push("/dashboard");
        }}
        onProject={() => {
          router.push(`/projects/${projectId}`);
        }}
      />
    );
  }

  return (
    <CreateProjectForm
      title={title}
      description={description}
      setTitle={setTitle}
      setDescription={setDescription}
      files={files}
      onRemoveFile={onRemoveFile}
      onSubmit={onSubmit}
      onFileUpload={onFileUpload}
    />
  );
}
