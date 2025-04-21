import type { Meta, StoryObj } from "@storybook/react";
import CreateProjectForm from "@/components/project/CreateProjectForm";
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
    title: "Project Title",
    description: "Project Description",
    setTitle: (title: string) => {
      alert(`Title set to: ${title}`);
    },
    setDescription: (description: string) => {
      alert(`Description set to: ${description}`);
    },
    onRemoveFile: (file: File) => {
      alert(`Trying to remove file: ${file.name}`);
    },
    onFileUpload: (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        alert(`File uploaded: ${file.name}`);
      });
    },
    onSubmit: () => {
      alert("Form submitted");
    },
    onDashboard: () => {
      alert("Back to dashboard");
    },
  },
};

export const LongFilenames: Story = {
  args: {
    files: [
      new File(
        ["file content"],
        "super-long-filename-which-might-cause-overflow-and-cause-issues-with-the-display.txt",
        { type: "text/plain" },
      ),
      new File(["another file content"], "example2.txt", {
        type: "text/plain",
      }),
    ],
    title: "Project Title",
    description: "Project Description",
    setTitle: (title: string) => {
      alert(`Title set to: ${title}`);
    },
    setDescription: (description: string) => {
      alert(`Description set to: ${description}`);
    },
    onRemoveFile: (file: File) => {
      alert(`Trying to remove file: ${file.name}`);
    },
    onFileUpload: (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        alert(`File uploaded: ${file.name}`);
      });
    },
    onSubmit: () => {
      alert("Form submitted");
    },
    onDashboard: () => {
      alert("Back to dashboard");
    },
  },
};
