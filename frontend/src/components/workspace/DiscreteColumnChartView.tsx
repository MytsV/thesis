import { DiscreteColumnChartViewModel } from "@/lib/types";
import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export interface DiscreteColumnChartViewProps {
  viewName: string;
  viewModel: DiscreteColumnChartViewModel;
}

export default function DiscreteColumnChartView(
  props: DiscreteColumnChartViewProps,
) {
  const chartData = useMemo(
    () => ({
      labels: props.viewModel.data.map((item) => item.label),
      datasets: [
        {
          label: props.viewModel.columnName,
          data: props.viewModel.data.map((item) => item.value),
          backgroundColor: [
            "rgba(243, 139, 168, 0.8)", // Pink
            "rgba(137, 180, 250, 0.8)", // Blue
            "rgba(249, 226, 175, 0.8)", // Yellow
            "rgba(166, 227, 161, 0.8)", // Green
            "rgba(203, 166, 247, 0.8)", // Lavender
            "rgba(186, 194, 222, 0.8)", // Grey
          ],
          borderColor: [
            "rgba(243, 139, 168, 1)", // Pink
            "rgba(137, 180, 250, 1)", // Blue
            "rgba(249, 226, 175, 1)", // Yellow
            "rgba(166, 227, 161, 1)", // Green
            "rgba(203, 166, 247, 1)", // Lavender
            "rgba(186, 194, 222, 1)", // Grey
          ],
          borderWidth: 1,
        },
      ],
    }),
    [props.viewModel],
  );

  const options: ChartOptions<"pie"> = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#000",
            font: {
              family: "Geist",
              size: 14,
            },
          },
        },
      },
    }),
    [],
  );

  return (
    <div className="flex flex-col w-full h-full space-y-4 justify-start">
      <h1 className="font-medium text-xl">
        {props.viewName}
        <span className="text-muted-foreground"> • </span>
        {props.viewModel.columnName}
      </h1>
      <div className="w-full" style={{ maxWidth: "500px" }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}
