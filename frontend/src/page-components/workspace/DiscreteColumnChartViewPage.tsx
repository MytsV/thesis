import { ViewViewModel } from "@/lib/types";
import React, { useCallback } from "react";
import { getDiscreteColumnChartData } from "@/lib/client-api";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import DiscreteColumnChartView from "@/components/workspace/DiscreteColumnChartView";

interface DiscreteColumnChartViewPageProps {
  view: ViewViewModel;
}

export default function DiscreteColumnChartViewPage(
  props: DiscreteColumnChartViewPageProps,
) {
  const viewModelQuery = useCallback(() => {
    return getDiscreteColumnChartData(props.view.id);
  }, [props.view.id]);

  const { data, error, isLoading } = useQuery({
    queryKey: ["chartData", props.view.id],
    queryFn: viewModelQuery,
  });

  if (!data) {
    return <Spinner />;
  }

  return (
    <DiscreteColumnChartView viewName={props.view.name} viewModel={data} />
  );
}
