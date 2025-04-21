import type { Meta, StoryObj } from "@storybook/react";
import InfoTab from "@/components/workspace/InfoTab";

const meta: Meta<typeof InfoTab> = {
  title: "Components/Workspace/InfoTab",
  component: InfoTab,
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
type Story = StoryObj<typeof InfoTab>;

export const Default: Story = {
  args: {
    project: {
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
    },
    onFileDownload: (relativePath: string) => {
      alert(`Download file with relative path: ${relativePath}`);
    },
  },
};
