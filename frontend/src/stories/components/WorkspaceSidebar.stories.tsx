import type { Meta, StoryObj } from "@storybook/react";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import React from "react";

const meta: Meta<typeof WorkspaceSidebar> = {
  title: "Components/Workspace/Sidebar",
  component: WorkspaceSidebar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex h-screen">
        <Story />
        <div className="flex-1 bg-gray-50 p-6">
          <h1 className="text-2xl font-bold mb-4">Main Application</h1>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WorkspaceSidebar>;

export const Default: Story = {
  args: {
    infoTab: <div className="p-4">Info Tab Content</div>,
    usersTab: <div className="p-4">Users Tab Content</div>,
    viewsTab: <div className="p-4">Views Tab Content</div>,
    chatTab: <div className="p-4">Chat Tab Content</div>,
    user: {
      id: 0,
      username: "testuser",
      email: "test@example.com",
    },
  },
};
