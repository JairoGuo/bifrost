import { createFileRoute } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView"
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib"
import RBACRedirectPage from "./page";

function RBACLayout({ children }: { children: React.ReactNode }) {
  const hasRbacAccess = useRbac(RbacResource.RBAC, RbacOperation.View)
  if (!hasRbacAccess) {
    return <NoPermissionView entity="roles and permissions" />
  }
  return <div>{children}</div>
}

function RouteComponent() {
	return (
		<RBACLayout>
			<RBACRedirectPage />
		</RBACLayout>
	);
}

export const Route = createFileRoute("/workspace/rbac")({
	component: RouteComponent,
});
