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
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 206, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
            "rgba(153, 102, 255, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
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
