import type { Meta, StoryObj } from "@storybook/react";
import UsersTab from "@/components/workspace/UsersTab";

const meta: Meta<typeof UsersTab> = {
  title: "Components/Workspace/UsersTab",
  component: UsersTab,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-120 h-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UsersTab>;

export const OwnerView: Story = {
  args: {
    inviteUsername: "",
    setInviteUsername: (username: string) => {
      alert(`Set invite username to ${username}`);
    },
    users: [
      {
        id: 0,
        username: "ktestuser1",
        color: "#e64553",
      },
      {
        id: 1,
        username: "testuser1",
        color: "#8839ef",
        avatarUrl:
          "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1143&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      {
        id: 2,
        username: "ytestuser1",
      },
    ],
    canInvite: true,
    onInviteClick: () => {
      alert("Invite user clicked");
    },
    onUserClick: (user) => {
      alert(`User clicked: ${user.username}`);
    },
    subscriptionUserId: 1,
  },
};

export const Loading: Story = {
  args: {
    inviteUsername: "",
    setInviteUsername: (username: string) => {
      alert(`Set invite username to ${username}`);
    },
    users: [],
    canInvite: true,
    onInviteClick: () => {
      alert("Invite user clicked");
    },
    isLoading: true,
    onUserClick: (user) => {
      alert(`User clicked: ${user.username}`);
    },
  },
};
