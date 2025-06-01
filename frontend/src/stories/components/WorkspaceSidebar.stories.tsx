import type { Meta, StoryObj } from "@storybook/react";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import React from "react";
import InfoTab from "@/components/workspace/InfoTab";
import UsersTab from "@/components/workspace/UsersTab";
import { ChatMessageViewModel, ViewType } from "@/lib/types";
import ChatTab from "@/components/workspace/ChatTab";

const meta: Meta<typeof WorkspaceSidebar> = {
  title: "Components/Workspace/Sidebar",
  component: WorkspaceSidebar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex h-screen">
        <Story />
        <div className="flex-1 bg-gray-50 p-6">
          <h1 className="text-2xl font-bold mb-4">Main Application</h1>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WorkspaceSidebar>;

export const Default: Story = {
  args: {
    infoTab: <div className="p-4">Info Tab Content</div>,
    usersTab: <div className="p-4">Users Tab Content</div>,
    viewsTab: <div className="p-4">Views Tab Content</div>,
    chatTab: <div className="p-4">Chat Tab Content</div>,
    user: {
      id: 0,
      username: "testuser",
    },
  },
};

const mockProject = {
  id: "357bcf1a-4199-4f05-b498-87edbdb7db54",
  title: "Test Project",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  createdAt: Date.now(),
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
};

const mockActiveUsers = [
  {
    id: 0,
    username: "ktestuser1",
    email: "test1@example.com",
    outlineColor: "#e64553",
  },
  {
    id: 1,
    username: "testuser1",
    email: "test1@example.com",
    outlineColor: "#8839ef",
    avatarUrl:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1143&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 2,
    username: "ytestuser1",
    email: "test1@example.com",
  },
];

const mockChatMessages: ChatMessageViewModel[] = [
  {
    id: "msg_001",
    content: "Hey everyone! Just joined the team. Excited to get started!",
    createdAt: 1716105600000, // May 19, 2025 10:00 AM UTC
    user: {
      id: 101,
      username: "sarah_chen",
    },
    view: {
      id: "general-chat",
      name: "General Chat",
      viewType: ViewType.SIMPLE_TABLE,
      fileId: 1,
    },
  },
  {
    id: "msg_002",
    content:
      "Welcome aboard Sarah! Let me know if you need any help getting up to speed.",
    createdAt: 1716106200000, // May 19, 2025 10:10 AM UTC
    user: {
      id: 102,
      username: "mike_rodriguez",
    },
    view: {
      id: "general-chat",
      name: "General Chat",
      viewType: ViewType.SIMPLE_TABLE,
      fileId: 1,
    },
  },
  {
    id: "msg_003",
    content:
      "Can someone review the latest design mockups? I've uploaded them to the shared folder.",
    createdAt: 1716107400000, // May 19, 2025 10:30 AM UTC
    user: {
      id: 103,
      username: "alex_kim",
    },
    view: {
      id: "design-team",
      name: "Design Team",
      viewType: ViewType.DISCRETE_COLUMN_CHART,
      fileId: 1,
    },
  },
  {
    id: "msg_004",
    content: "Looks great! I particularly like the new color scheme you chose.",
    createdAt: 1716108000000, // May 19, 2025 10:40 AM UTC
    user: {
      id: 104,
      username: "emma_wilson",
    },
    view: {
      id: "design-team",
      name: "Design Team",
      viewType: ViewType.DISCRETE_COLUMN_CHART,
      fileId: 1,
    },
  },
  {
    id: "msg_005",
    content:
      "Quick question about the API endpoints - are we using REST or GraphQL for the new feature?",
    createdAt: 1716109800000, // May 19, 2025 11:10 AM UTC
    user: {
      id: 105,
      username: "dev_james",
    },
    view: {
      id: "backend-dev",
      name: "Backend Development",
      viewType: ViewType.SIMPLE_TABLE,
      fileId: 1,
    },
  },
  {
    id: "msg_006",
    content: "Hey, do you have 5 minutes to chat about the project timeline?",
    createdAt: 1716110400000, // May 19, 2025 11:20 AM UTC
    user: {
      id: 106,
      username: "lisa_parker",
    },
    view: {
      id: "dm-lisa-john",
      name: "Lisa Parker",
      viewType: ViewType.DISCRETE_COLUMN_CHART,
      fileId: 1,
    },
  },
  {
    id: "msg_007",
    content:
      "We're going with REST for now, but might migrate to GraphQL in Q3. Check the tech doc I shared yesterday.",
    createdAt: 1716111000000, // May 19, 2025 11:30 AM UTC
    user: {
      id: 107,
      username: "senior_dev_anna",
    },
    view: {
      id: "backend-dev",
      name: "Backend Development",
      viewType: ViewType.SIMPLE_TABLE,
      fileId: 1,
    },
  },
  {
    id: "msg_008",
    content: "Perfect timing! Coffee break anyone? ☕",
    createdAt: 1716112200000, // May 19, 2025 11:50 AM UTC
    user: {
      id: 108,
      username: "coffee_lover_tom",
    },
    view: {
      id: "random",
      name: "Random",
      viewType: ViewType.DISCRETE_COLUMN_CHART,
      fileId: 1,
    },
  },
  {
    id: "msg_009",
    content:
      "Thanks for the quick turnaround on those bug fixes! Everything is working smoothly now.",
    createdAt: 1716113400000, // May 19, 2025 12:10 PM UTC
    user: {
      id: 109,
      username: "qa_tester_ben",
    },
    view: {
      id: "dev-team",
      name: "Development Team",
      viewType: ViewType.SIMPLE_TABLE,
      fileId: 1,
    },
  },
  {
    id: "msg_010",
    content: "Absolutely! Let's grab a virtual coffee in 10 minutes?",
    createdAt: 1716113700000, // May 19, 2025 12:15 PM UTC
    user: {
      id: 106,
      username: "lisa_parker",
    },
    view: {
      id: "dm-lisa-john",
      name: "Lisa Parker",
      viewType: ViewType.DISCRETE_COLUMN_CHART,
      fileId: 1,
    },
  },
];

export const Integration: Story = {
  args: {
    infoTab: (
      <InfoTab
        project={mockProject}
        onFileDownload={() => {
          alert("Download file");
        }}
      />
    ),
    usersTab: (
      <UsersTab
        users={mockActiveUsers}
        onInviteClick={() => {
          alert("Invite user clicked");
        }}
        canInvite={true}
        inviteUsername=""
        setInviteUsername={(username: string) => {
          alert(`Set invite username to ${username}`);
        }}
      />
    ),
    viewsTab: <div className="p-4">Views Tab Content</div>,
    chatTab: (
      <ChatTab
        messages={mockChatMessages}
        currentUserId={106}
        onViewClicked={() => {}}
        onSendMessage={() => {}}
      />
    ),
    user: {
      id: 0,
      username: "testuser",
    },
    subscriptionUserColor: "#8839ef",
    unreadMessagesCount: 5,
  },
};
