import type { Meta, StoryObj } from "@storybook/react";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import React from "react";
import InfoTab from "@/components/workspace/InfoTab";
import UsersTab from "@/components/workspace/UsersTab";

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

const mockProject = {
  id: "357bcf1a-4199-4f05-b498-87edbdb7db54",
  title: "Test Project",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  createdAt: new Date(Date.now()),
  owner: {
    id: 0,
    username: "testuser",
    email: "test@example.com",
  },
  files: [
    {
      id: 0,
      name: "test1.csv",
      relativePath: "/test1.csv",
    },
    {
      id: 1,
      name: "test2.csv",
      relativePath: "/test2.csv",
    },
  ],
};

const mockActiveUsers = [
  {
    id: 0,
    username: "ktestuser1",
    email: "test1@example.com",
    outlineColor: "#e64553",
  },
  {
    id: 1,
    username: "testuser1",
    email: "test1@example.com",
    outlineColor: "#8839ef",
    avatarUrl:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1143&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 2,
    username: "ytestuser1",
    email: "test1@example.com",
  },
];

export const Integration: Story = {
  args: {
    infoTab: (
      <InfoTab
        project={mockProject}
        onFileDownload={() => {
          alert("Download file");
        }}
      />
    ),
    usersTab: (
      <UsersTab
        activeUsers={mockActiveUsers}
        onInviteClick={() => {
          alert("Invite user clicked");
        }}
      />
    ),
    viewsTab: <div className="p-4">Views Tab Content</div>,
    chatTab: <div className="p-4">Chat Tab Content</div>,
    user: {
      id: 0,
      username: "testuser",
      email: "test@example.com",
    },
  },
};
