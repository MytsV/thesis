import type { Meta, StoryObj } from "@storybook/react";
import ViewsTab from "@/components/workspace/ViewsTab";
import { ViewType } from "@/lib/types";

const meta: Meta<typeof ViewsTab> = {
  title: "Components/Workspace/ViewsTab",
  component: ViewsTab,
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
type Story = StoryObj<typeof ViewsTab>;

export const Default: Story = {
  args: {
    onCreateClick: (viewType) => {
      alert("Create view clicked with type: " + viewType);
    },
    viewTypesMeta: [
      {
        type: ViewType.SIMPLE_TABLE,
        name: "Simple Table",
        icon: <span>📑</span>,
      },
      {
        type: ViewType.DISCRETE_COLUMN_CHART,
        name: "Chart",
        icon: <span>📊</span>,
      },
    ],
    views: [
      {
        id: "b2ec1a23-1f90-4c11-ba71-83819de1b521",
        name: "View 1",
        viewType: ViewType.SIMPLE_TABLE,
      },
      {
        id: "d4c6a8be-7aae-4cfb-929f-7f294e7f9e75",
        name: "Really long view name that should be truncated or else it will overflow",
        viewType: ViewType.DISCRETE_COLUMN_CHART,
      },
      {
        id: "081ffacb-1776-4d2d-966c-891702c3d1c3",
        name: "View 3",
        viewType: ViewType.DISCRETE_COLUMN_CHART,
      },
    ],
    currentViewId: "b2ec1a23-1f90-4c11-ba71-83819de1b521",
    onViewClick: (view) => {
      alert("View clicked with ID: " + view.id);
    },
    users: {
      "b2ec1a23-1f90-4c11-ba71-83819de1b521": [
        {
          id: 0,
          username: "user1",
          color: "#e64553",
        },
        {
          id: 1,
          username: "user2",
          color: "#8839ef",
        },
      ],
      "d4c6a8be-7aae-4cfb-929f-7f294e7f9e75": [
        {
          id: 2,
          username: "user3",
          color: "#209fb5",
        },
      ],
    },
  },
};
