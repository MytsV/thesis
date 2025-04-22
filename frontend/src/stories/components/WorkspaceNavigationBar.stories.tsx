import type { Meta, StoryObj } from "@storybook/react";
import WorkspaceNavigationBar from "@/components/workspace/WorkspaceNavigationBar";

const meta: Meta<typeof WorkspaceNavigationBar> = {
  title: "Components/Workspace/NavigationBar",
  component: WorkspaceNavigationBar,
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
type Story = StoryObj<typeof WorkspaceNavigationBar>;

export const NoCollaboration: Story = {
  args: {
    onLogoClick: () => {
      alert("Logo clicked");
    },
    projectName: "Test Project",
  },
};

export const FewConcurrentUsers: Story = {
  args: {
    onLogoClick: () => {
      alert("Logo clicked");
    },
    projectName: "Test Project",
    activeUsers: [
      {
        id: 0,
        username: "ktestuser1",
        email: "test1@example.com",
        outlineColor: "#e64553",
      },
      {
        id: 0,
        username: "testuser1",
        email: "test1@example.com",
        outlineColor: "#8839ef",
        avatarUrl:
          "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1143&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
    ],
  },
};

export const ManyConcurrentUsers: Story = {
  args: {
    onLogoClick: () => {
      alert("Logo clicked");
    },
    projectName: "Test Project",
    activeUsers: [
      {
        id: 0,
        username: "ktestuser1",
        email: "test1@example.com",
        outlineColor: "#e64553",
      },
      {
        id: 0,
        username: "testuser1",
        email: "test1@example.com",
        outlineColor: "#8839ef",
        avatarUrl:
          "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1143&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      {
        id: 0,
        username: "ytestuser1",
        email: "test1@example.com",
        outlineColor: "#209fb5",
      },
      {
        id: 0,
        username: "testuser1",
        email: "test1@example.com",
        outlineColor: "#209fb5",
      },
      {
        id: 0,
        username: "testuser1",
        email: "test1@example.com",
        outlineColor: "#209fb5",
      },
      {
        id: 0,
        username: "testuser1",
        email: "test1@example.com",
        outlineColor: "#209fb5",
      },
    ],
  },
};

export const LongProjectName: Story = {
  args: {
    onLogoClick: () => {
      alert("Logo clicked");
    },
    projectName:
      "A very long project name that might overflow and cause issues when displayed while rendering the component in the UI",
    activeUsers: [
      {
        id: 0,
        username: "ktestuser1",
        email: "test1@example.com",
        outlineColor: "#e64553",
      },
      {
        id: 0,
        username: "testuser1",
        email: "test1@example.com",
        outlineColor: "#8839ef",
        avatarUrl:
          "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1143&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
    ],
  },
};
