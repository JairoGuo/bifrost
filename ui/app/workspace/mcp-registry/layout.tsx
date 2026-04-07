import { createFileRoute } from "@tanstack/react-router";
import { NoPermissionView } from "@/components/noPermissionView"
import { RbacOperation, RbacResource, useRbac } from "@enterprise/lib"
import MCPServersPage from "./page";

function MCPGatewayLayout({ children }: { children: React.ReactNode }) {
  const hasMCPGatewayAccess = useRbac(RbacResource.MCPGateway, RbacOperation.View)
  if (!hasMCPGatewayAccess) {
    return <NoPermissionView entity="MCP gateway configuration" />
  }
  return <div>{children}</div>
}

function RouteComponent() {
	return (
		<MCPGatewayLayout>
			<MCPServersPage />
		</MCPGatewayLayout>
	);
}

export const Route = createFileRoute("/workspace/mcp-registry")({
	component: RouteComponent,
});
