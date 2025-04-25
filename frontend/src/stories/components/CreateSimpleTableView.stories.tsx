import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import CreateSimpleTableView from "@/components/workspace/CreateSimpleTableView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof CreateSimpleTableView> = {
  title: "Components/Workspace/CreateSimpleTableView",
  component: CreateSimpleTableView,
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
            <DialogTitle>Simple Table View</DialogTitle>
          </DialogHeader>
          <Story />
        </DialogContent>
      </Dialog>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CreateSimpleTableView>;

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
    onSubmit: () => {
      alert("Submit clicked");
    },
  },
};
