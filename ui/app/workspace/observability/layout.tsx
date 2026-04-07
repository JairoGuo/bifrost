import { createFileRoute } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView"
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib"
import ObservabilityPage from "./page";

function ObservabilityLayout({ children }: { children: React.ReactNode }) {
  const hasObservabilityAccess = useRbac(RbacResource.Observability, RbacOperation.View)
  if (!hasObservabilityAccess) {
    return <NoPermissionView entity="observability settings" />
  }
  return <div>{children}</div>
}

function RouteComponent() {
	return (
		<ObservabilityLayout>
			<ObservabilityPage />
		</ObservabilityLayout>
	);
}

export const Route = createFileRoute("/workspace/observability")({
	component: RouteComponent,
});
