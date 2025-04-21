import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import CreateProjectSuccess from "@/components/project/CreateProjectSuccess";

const meta: Meta<typeof CreateProjectSuccess> = {
  title: "Components/Project/CreateProjectSuccess",
  component: CreateProjectSuccess,
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
type Story = StoryObj<typeof CreateProjectSuccess>;

export const Default: Story = {
  args: {
    projectId: "357bcf1a-4199-4f05-b498-87edbdb7db54",
    onDashboard: () => {
      alert("Back to dashboard");
    },
    onProject: () => {
      alert("Go to project");
    },
  },
};
