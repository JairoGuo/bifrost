import { createFileRoute } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView"
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib"
import SCIMPage from "./page";

function SCIMLayout({ children }: { children: React.ReactNode }) {
  const hasUserProvisioningAccess = useRbac(RbacResource.UserProvisioning, RbacOperation.View)
  if (!hasUserProvisioningAccess) {
    return <NoPermissionView entity="user provisioning" />
  }
  return <div>{children}</div>
}

function RouteComponent() {
	return (
		<SCIMLayout>
			<SCIMPage />
		</SCIMLayout>
	);
}

export const Route = createFileRoute("/workspace/scim")({
	component: RouteComponent,
});
