import type { Meta, StoryObj } from "@storybook/react";
import CreateProjectForm from "@/components/CreateProjectForm";
import React from "react";

const meta: Meta<typeof CreateProjectForm> = {
  title: "Components/Project/CreateProjectForm",
  component: CreateProjectForm,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CreateProjectForm>;

export const Default: Story = {
  args: {
    files: [
      new File(["file content"], "example.txt", { type: "text/plain" }),
      new File(["another file content"], "example2.txt", {
        type: "text/plain",
      }),
    ],
    onRemoveFile: (file: File) => {
      alert(`Trying to remove file: ${file.name}`);
    },
    onFileUpload: (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        alert(`File uploaded: ${file.name}`);
      });
    },
    onSubmit: (title: string, description: string) => {
      alert(`Title: ${title}, Description: ${description}`);
    },
  },
};

export const LongFilenames: Story = {
  args: {
    files: [
      new File(
        ["file content"],
        "super-long-filename-which-might-cause-overflow.txt",
        { type: "text/plain" },
      ),
      new File(["another file content"], "example2.txt", {
        type: "text/plain",
      }),
    ],
    onRemoveFile: (file: File) => {
      alert(`Trying to remove file: ${file.name}`);
    },
    onFileUpload: (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        alert(`File uploaded: ${file.name}`);
      });
    },
    onSubmit: (title: string, description: string) => {
      alert(`Title: ${title}, Description: ${description}`);
    },
  },
};
