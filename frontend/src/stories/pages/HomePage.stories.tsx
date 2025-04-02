import type { Meta, StoryObj } from "@storybook/react";
import { HomePage } from "@/pages/HomePage";

const meta: Meta<typeof HomePage> = {
  title: "Pages/HomePage",
  component: HomePage,
  parameters: {
    // Optional parameter to make the story take up the entire viewport
    layout: "fullscreen",
  },
  // Add tags for organization in Storybook's sidebar
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof HomePage>;

// Default story
export const Default: Story = {};

// You can add variations if needed in the future
export const WithCustomProps: Story = {
  // When you add props to your HomePage component, you can use them here
  // args: {
  //   title: 'Welcome to Our App',
  //   showFeatures: true,
  // },
};
