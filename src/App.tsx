import AppRoutes from "./routes/index.js";
import ParticleBurstLayer from "./components/ui/ParticleBurstLayer.js";

export default function App() {
    return (
        <>
            <ParticleBurstLayer />
            <AppRoutes />
        </>
    );
}
