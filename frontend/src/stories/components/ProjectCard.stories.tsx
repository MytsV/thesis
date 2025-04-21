import type { Meta, StoryObj } from "@storybook/react";
import ProjectCard from "@/components/project/ProjectCard";

const meta: Meta<typeof ProjectCard> = {
  title: "Components/Project/ProjectCard",
  component: ProjectCard,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-120">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProjectCard>;

export const ShortTitleDescription: Story = {
  args: {
    title: "Project Title",
    description: "Project Description",
    onClick: () => {
      alert("Project clicked");
    },
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Project Title",
    onClick: () => {
      alert("Project clicked");
    },
  },
};

export const Live: Story = {
  args: {
    title: "Project Title",
    description: "Project Description",
    isLive: true,
    liveCollaboratorsCount: 3,
    onClick: () => {
      alert("Project clicked");
    },
  },
};

export const Authored: Story = {
  args: {
    title: "Project Title",
    description: "Project Description",
    isLive: true,
    liveCollaboratorsCount: 3,
    author: "testuser",
    onClick: () => {
      alert("Project clicked");
    },
  },
};

export const LongValues: Story = {
  args: {
    title: "Project Title with a very long title that might overflow",
    description:
      "Project Description with a very long description that might overflow and cause issues when displayed while rendering the component in the UI",
    isLive: true,
    liveCollaboratorsCount: 3,
    author:
      "testuser with a very long username that might overflow and cause issues",
    onClick: () => {
      alert("Project clicked");
    },
  },
};
