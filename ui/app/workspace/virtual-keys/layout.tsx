import { NoPermissionView } from "@/components/noPermissionView";
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib";
import { createFileRoute } from "@tanstack/react-router";
import VirtualKeysRedirectPage from "./page";

function VirtualKeysLayout({ children }: { children: React.ReactNode }) {
	const hasVirtualKeysAccess = useRbac(RbacResource.VirtualKeys, RbacOperation.View);
	if (!hasVirtualKeysAccess) {
		return <NoPermissionView entity="virtual keys" />;
	}
	return <div>{children}</div>;
}

function RouteComponent() {
	return (
		<VirtualKeysLayout>
			<VirtualKeysRedirectPage />
		</VirtualKeysLayout>
	);
}

export const Route = createFileRoute("/workspace/virtual-keys")({
	component: RouteComponent,
});
