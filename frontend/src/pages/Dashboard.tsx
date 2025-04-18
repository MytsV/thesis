"use client";

import { useUser } from "@/lib/user-provision";
import ProjectList from "@/components/ProjectList";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/lib/api";
import ProjectCard from "@/components/ProjectCard";
import { useCallback, useState } from "react";
import { ProjectListTabs } from "@/lib/types";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 6;

export default function Dashboard() {
  const user = useUser();
  const [page, setPage] = useState<number>(1);
  const [tab, setTab] = useState<ProjectListTabs>(ProjectListTabs.MINE);

  const runQuery = useCallback(async () => {
    if (tab === ProjectListTabs.SHARED) return { data: [], hasNextPage: false };
    return listProjects({ page, pageSize: PAGE_SIZE });
  }, [page, tab]);

  const { data, error, isLoading } = useQuery({
    queryKey: ["projects", page, tab],
    queryFn: runQuery,
  });

  const router = useRouter();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const getProjectCards = () => {
    return data?.data.map((project) => (
      <ProjectCard
        key={project.id}
        title={project.title}
        description={project.description}
        onClick={() => {
          router.push(`/projects/${project.id}`);
        }}
      />
    ));
  };

  return (
    <ProjectList
      onTabChange={(value) => setTab(value)}
      onPageNext={() => setPage((prevState) => prevState + 1)}
      onPagePrevious={() => setPage((prevState) => prevState - 1)}
      onCreateProject={() => {
        router.push("/projects/create");
      }}
      currentPage={page}
      hasNextPage={data?.hasNextPage ?? false}
      isLoading={isLoading}
    >
      {getProjectCards()}
    </ProjectList>
  );
}
