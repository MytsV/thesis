import type { Meta, StoryObj } from "@storybook/react";
import DiscreteColumnChartView from "@/components/workspace/DiscreteColumnChartView";

const meta: Meta<typeof DiscreteColumnChartView> = {
  title: "Components/Workspace/DiscreteColumnChartView",
  component: DiscreteColumnChartView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DiscreteColumnChartView>;

export const Default: Story = {
  args: {
    viewName: "View Name",
    viewModel: {
      columnName: "Column Name",
      data: [
        { label: "Label 1", value: 10 },
        { label: "Label 2", value: 20 },
        { label: "Label 3", value: 30 },
        { label: "Label 4", value: 40 },
        { label: "Label 5", value: 50 },
      ],
    },
  },
};
