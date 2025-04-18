import type { Meta, StoryObj } from "@storybook/react";
import ProjectList, { ProjectListTabs } from "@/components/ProjectList";
import ProjectCard from "@/components/ProjectCard";

const meta: Meta<typeof ProjectList> = {
  title: "Components/Project/ProjectList",
  component: ProjectList,
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
type Story = StoryObj<typeof ProjectList>;

const ProjectCardMock = () => {
  return (
    <ProjectCard
      title="Project Title with a very long title that might overflow"
      description="Project Description with a very long description that might overflow and cause issues when displayed while rendering the component in the UI"
      isLive={true}
      liveCollaboratorsCount={3}
      author="testuser with a very long username that might overflow and cause issues"
      onClick={() => {
        alert("Project clicked");
      }}
    />
  );
};

export const Default: Story = {
  args: {
    onPageNext: () => {
      alert("Next page");
    },
    onPagePrevious: () => {
      alert("Previous page");
    },
    currentPage: 1,
    hasNextPage: true,
    onTabChange: (tab) => {
      alert(`Tab changed to ${tab}`);
    },
    children: [
      <ProjectCardMock key={1} />,
      <ProjectCardMock key={2} />,
      <ProjectCardMock key={3} />,
      <ProjectCardMock key={4} />,
      <ProjectCardMock key={5} />,
      <ProjectCardMock key={6} />,
      <ProjectCardMock key={7} />,
      <ProjectCardMock key={8} />,
      <ProjectCardMock key={9} />,
    ],
    onCreateProject: () => {
      alert("Create project clicked");
    },
  },
};

export const LittleContent: Story = {
  args: {
    onPageNext: () => {
      alert("Next page");
    },
    onPagePrevious: () => {
      alert("Previous page");
    },
    currentPage: 5,
    hasNextPage: true,
    onTabChange: (tab) => {
      alert(`Tab changed to ${tab}`);
    },
    children: [
      <ProjectCardMock key={1} />,
      <ProjectCardMock key={2} />,
      <ProjectCardMock key={3} />,
    ],
    onCreateProject: () => {
      alert("Create project clicked");
    },
  },
};

export const NoProjects: Story = {
  args: {
    onPageNext: () => {
      alert("Next page");
    },
    onPagePrevious: () => {
      alert("Previous page");
    },
    currentPage: 1,
    hasNextPage: false,
    onTabChange: (tab) => {
      alert(`Tab changed to ${tab}`);
    },
    children: [],
    onCreateProject: () => {
      alert("Create project clicked");
    },
  },
};

export const Loading: Story = {
  args: {
    onPageNext: () => {
      alert("Next page");
    },
    onPagePrevious: () => {
      alert("Previous page");
    },
    currentPage: 1,
    hasNextPage: false,
    onTabChange: (tab) => {
      alert(`Tab changed to ${tab}`);
    },
    children: [],
    onCreateProject: () => {
      alert("Create project clicked");
    },
    isLoading: true,
  },
};
