import SiteHeader from "./SiteHeader.js";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="app-shell">
            <SiteHeader />
            {children}
        </div>
    );
}
