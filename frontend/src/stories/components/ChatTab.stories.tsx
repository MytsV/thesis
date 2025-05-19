import type { Meta, StoryObj } from "@storybook/react";
import ChatTab from "@/components/workspace/ChatTab";
import { ChatMessageViewModel, ViewType } from "@/lib/types";

const meta: Meta<typeof ChatTab> = {
  title: "Components/Workspace/ChatTab",
  component: ChatTab,
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
type Story = StoryObj<typeof ChatTab>;

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
      viewType: ViewType.CHART,
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
      viewType: ViewType.CHART,
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
      viewType: ViewType.CHART,
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
      viewType: ViewType.CHART,
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
      viewType: ViewType.CHART,
    },
  },
];

export const Default: Story = {
  args: {
    messages: mockChatMessages,
    currentUserId: 106,
    onViewClicked: (view) => {
      alert(`View clicked: ${view.name} (${view.viewType})`);
    },
    onSendMessage: (message) => {
      alert(`Message sent: ${message}`);
    },
  },
};
