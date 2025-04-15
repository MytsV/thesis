import type { Meta, StoryObj } from "@storybook/react";
import LoginForm from "@/components/custom/LoginForm";

const meta: Meta<typeof LoginForm> = {
  title: "Components/Login/LoginForm",
  component: LoginForm,
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
type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {
  args: {
    onLogin: async (credentials) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(
        `Username: ${credentials.username}, Password: ${credentials.password}`,
      );
    },
  },
};
