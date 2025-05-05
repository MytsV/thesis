import type { Meta, StoryObj } from "@storybook/react";
import SimpleTableView from "@/components/workspace/SimpleTableView";
import { ColumnType, RowViewModel } from "@/lib/types";

const meta: Meta<typeof SimpleTableView> = {
  title: "Components/Workspace/SimpleTableView",
  component: SimpleTableView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="h-screen p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SimpleTableView>;

const columns = [
  { columnName: "productName", columnType: ColumnType.STRING },
  { columnName: "quantity", columnType: ColumnType.INT },
  { columnName: "price", columnType: ColumnType.FLOAT },
  { columnName: "isInStock", columnType: ColumnType.BOOLEAN },
  { columnName: "lastUpdated", columnType: ColumnType.DATETIME },
];

function generateMockData(count: number): RowViewModel[] {
  const productPrefixes = [
    "Premium",
    "Standard",
    "Basic",
    "Elite",
    "Pro",
    "Advanced",
    "Ultimate",
    "Essential",
  ];
  const productTypes = [
    "Laptop",
    "Phone",
    "Tablet",
    "Monitor",
    "Keyboard",
    "Mouse",
    "Headset",
    "Camera",
    "Printer",
    "Speaker",
  ];

  const rows: RowViewModel[] = [];

  for (let i = 1; i <= count; i++) {
    const prefixIndex = Math.floor(Math.random() * productPrefixes.length);
    const typeIndex = Math.floor(Math.random() * productTypes.length);

    // Generate random values for each field
    const productName = `${productPrefixes[prefixIndex]} ${productTypes[typeIndex]} ${i}`;
    const quantity = Math.floor(Math.random() * 100) + 1;
    const price = parseFloat((Math.random() * 1000 + 50).toFixed(2));
    const isInStock = Math.random() > 0.2; // 80% chance of being in stock

    // Generate a random date within the last year
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const randomTimestamp =
      oneYearAgo.getTime() +
      Math.random() * (now.getTime() - oneYearAgo.getTime());
    const lastUpdated = new Date(randomTimestamp).toISOString();

    rows.push({
      id: `row-${i}`,
      data: {
        productName,
        quantity,
        price,
        isInStock,
        lastUpdated,
      },
    });
  }

  return rows;
}

export const Default: Story = {
  args: {
    columns: columns,
    rows: generateMockData(100),
    highlight: {
      "row-1": "#e64553",
      "row-4": "#8839ef",
      "row-5": "#209fb5",
    },
    onRowHover: (rowId: string) => {
      alert("Row hovered with ID: " + rowId);
    },
  },
};
