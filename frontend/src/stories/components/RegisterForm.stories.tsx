import type { Meta, StoryObj } from "@storybook/react";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

const meta: Meta<typeof RegisterForm> = {
  title: "Components/Register/RegisterForm",
  component: RegisterForm,
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
type Story = StoryObj<typeof RegisterForm>;

export const Default: Story = {
  args: {
    onRegister: async (data) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(
        `Username: ${data.username}, Email: ${data.email}, Password: ${data.password}`,
      );
    },
  },
};
