import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import FullPageLoader from "@/components/fullPageLoader"
import { NoPermissionView } from "@/components/noPermissionView"
import { useGetCoreConfigQuery } from "@/lib/store"
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib"
import ConfigPage from "./page";

function ConfigLayout({ children }: { children: React.ReactNode }) {
  const hasConfigAccess = useRbac(RbacResource.Settings, RbacOperation.View)
  const { isLoading } = useGetCoreConfigQuery({ fromDB: true })

  if (!hasConfigAccess) {
    return <NoPermissionView entity="configuration" />
  }

  if (isLoading) {
    return <FullPageLoader />
  }

  return <div>{children}</div>
}

function RouteComponent() {
	const childMatches = useChildMatches();
	return (
		<ConfigLayout>{childMatches.length === 0 ? <ConfigPage /> : <Outlet />}</ConfigLayout>
	);
}

export const Route = createFileRoute("/workspace/config")({
	component: RouteComponent,
});
