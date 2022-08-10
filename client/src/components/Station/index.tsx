import {Navigate} from "react-router-dom";
import {lazy, Suspense} from "react";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {useNetRequest} from "client/src/context/useNetRequest";

const FlightDirectorLayout = lazy(() => import("../FlightDirector"));
const StationLayout = lazy(() => import("./StationLayout"));
const Effects = lazy(() => import("./Effects"));

const StationWrapper = () => {
  const client = useNetRequest("client");
  const station = useNetRequest("station");
  // TODO November 29, 2021: Include sound player here
  // TODO November 29, 2021: Include some kind of alert toast notification thing here
  // The existing alerts won't be targeted by the theme, so we need to embed it here.
  if (!station) return <Navigate to="/" />;
  if (station.name === "Flight Director") return <FlightDirectorLayout />;
  return (
    <div className="bg-black absolute z-1 h-full w-full top-0 bottom-">
      {client.offlineState !== "blackout" && (
        <>
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
          <Suspense fallback={<LoadingSpinner />}>
            <StationLayout />
          </Suspense>
        </>
      )}
    </div>
  );
};

export default StationWrapper;
