import { createFileRoute } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/themeProvider";
import { ReduxProvider } from "@/lib/store/provider";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import LoginPage from "./page";

function LoginLayout({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<ReduxProvider>
				<NuqsAdapter>
					<div className="bg-background min-h-screen">{children}</div>
				</NuqsAdapter>
			</ReduxProvider>
		</ThemeProvider>
	);
}

function RouteComponent() {
	return (
		<LoginLayout>
			<LoginPage />
		</LoginLayout>
	);
}

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});
