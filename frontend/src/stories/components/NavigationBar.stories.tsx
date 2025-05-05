import type { Meta, StoryObj } from "@storybook/react";
import NavigationBar from "@/components/NavigationBar";

const meta: Meta<typeof NavigationBar> = {
  title: "Components/NavigationBar",
  component: NavigationBar,
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
type Story = StoryObj<typeof NavigationBar>;

export const Unauthenticated: Story = {
  args: {
    onLogoClick: () => {
      alert("Logo clicked");
    },
  },
};

export const Authenticated: Story = {
  args: {
    onLogoClick: () => {
      alert("Logo clicked");
    },
    user: {
      id: 1,
      username: "testuser",
    },
    onLogout: () => {
      alert("Logout clicked");
    },
  },
};

export const LongUsername: Story = {
  args: {
    onLogoClick: () => {
      alert("Logo clicked");
    },
    user: {
      id: 1,
      username: "testuserwithalongusernamethatmightoverflow",
    },
    onLogout: () => {
      alert("Logout clicked");
    },
  },
};

export const UserLoading: Story = {
  args: {
    onLogoClick: () => {
      alert("Logo clicked");
    },
    user: undefined,
    onLogout: () => {
      alert("Logout clicked");
    },
    isUserLoading: true,
  },
};
