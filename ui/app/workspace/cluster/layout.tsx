import { createFileRoute } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView"
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib"
import ClusterPage from "./page";

function ClusterLayout({ children }: { children: React.ReactNode }) {
  const hasClusterAccess = useRbac(RbacResource.Cluster, RbacOperation.View)
  if (!hasClusterAccess) {
    return <NoPermissionView entity="cluster configuration" />
  }
  return <div>{children}</div>
}

function RouteComponent() {
	return (
		<ClusterLayout>
			<ClusterPage />
		</ClusterLayout>
	);
}

export const Route = createFileRoute("/workspace/cluster")({
	component: RouteComponent,
});
