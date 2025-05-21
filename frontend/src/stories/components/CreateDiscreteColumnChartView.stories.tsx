import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreateDiscreteColumnChartView from "@/components/workspace/CreateDiscreteColumnChartView";
import { ColumnType } from "@/lib/types";

const meta: Meta<typeof CreateDiscreteColumnChartView> = {
  title: "Components/Workspace/CreateDiscreteColumnChartView",
  component: CreateDiscreteColumnChartView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <Dialog>
        <DialogTrigger>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discrete Column Chart View</DialogTitle>
          </DialogHeader>
          <Story />
        </DialogContent>
      </Dialog>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CreateDiscreteColumnChartView>;

export const Default: Story = {
  args: {
    name: "",
    setName: (name: string) => {
      alert(`Set name to ${name}`);
    },
    availableFiles: [
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
    onFileSelect: (fileId) => {
      alert(`File selected with id: ${fileId}`);
    },
    availableColumns: [
      {
        id: 0,
        columnName: "Column 1",
        columnType: ColumnType.STRING,
      },
      {
        id: 1,
        columnName: "Column 2",
        columnType: ColumnType.FLOAT,
      },
    ],
    onColumnSelect: (columnId) => {
      alert(`Column selected with id: ${columnId}`);
    },
    onSubmit: () => {
      alert("Submit clicked");
    },
  },
};
