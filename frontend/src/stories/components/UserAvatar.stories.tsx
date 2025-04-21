import type { Meta, StoryObj } from "@storybook/react";
import UserAvatar from "@/components/common/UserAvatar";

const meta: Meta<typeof UserAvatar> = {
  title: "Components/Common/UserAvatar",
  component: UserAvatar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof UserAvatar>;

export const NoAvatarUrl: Story = {
  args: {
    user: {
      id: 0,
      username: "testuser",
      email: "test@example.com",
    },
  },
};

export const Enlarged: Story = {
  args: {
    user: {
      id: 0,
      username: "testuser",
      email: "test@example.com",
    },
    className: "w-20 h-20 text-2xl",
  },
};

export const AvatarUrl: Story = {
  args: {
    user: {
      id: 0,
      username: "testuser",
      email: "test@example.com",
      avatarUrl:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1143&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  },
};

export const AvatarUrlOutlined: Story = {
  args: {
    user: {
      id: 0,
      username: "testuser",
      email: "test@example.com",
      avatarUrl:
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1143&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    outlineColor: "mediumpurple",
  },
};

export const NoAvatarUrlOutlined: Story = {
  args: {
    user: {
      id: 0,
      username: "testuser",
      email: "test@example.com",
    },
    outlineColor: "#8c84e3",
  },
};
