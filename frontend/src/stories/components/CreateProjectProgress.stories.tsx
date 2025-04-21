import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import CreateProjectProgress from "@/components/project/CreateProjectProgress";

const meta: Meta<typeof CreateProjectProgress> = {
  title: "Components/Project/CreateProjectProgress",
  component: CreateProjectProgress,
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
type Story = StoryObj<typeof CreateProjectProgress>;

export const Default: Story = {
  args: {
    value: 50,
  },
};
