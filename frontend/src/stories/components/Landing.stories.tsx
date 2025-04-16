import type { Meta, StoryObj } from "@storybook/react";
import Landing from "@/components/Landing";

const meta: Meta<typeof Landing> = {
  title: "Components/Landing",
  component: Landing,
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
type Story = StoryObj<typeof Landing>;

export const Unauthenticated: Story = {
  args: {
    onLogin: async () => {
      alert("Login clicked");
    },
    onRegister: () => {
      alert("Register clicked");
    },
    onDashboard: () => {
      alert("Dashboard clicked");
    },
    isAuthenticated: false,
  },
};

export const Authenticated: Story = {
  args: {
    onLogin: async () => {
      alert("Login clicked");
    },
    onRegister: () => {
      alert("Register clicked");
    },
    onDashboard: () => {
      alert("Dashboard clicked");
    },
    isAuthenticated: true,
  },
};
