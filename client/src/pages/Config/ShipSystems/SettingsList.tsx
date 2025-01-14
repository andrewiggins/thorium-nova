import {q} from "@client/context/AppContext";
import {useContext} from "react";
import {useParams} from "react-router-dom";
import {Link} from "react-router-dom";
import {ShipPluginIdContext} from "../Ships/ShipSystemOverrideContext";

export function SettingsList() {
  const params = useParams();
  const setting = params["*"]?.split("/")[1];
  const {pluginId, systemId, shipId} = params as {
    pluginId: string;
    systemId: string;
    shipId: string;
  };
  const shipPluginId = useContext(ShipPluginIdContext);

  const [system] = q.plugin.systems.get.useNetRequest({
    pluginId,
    systemId,
    shipId,
    shipPluginId,
  });
  const [availableShipSystems] = q.plugin.systems.available.useNetRequest();
  if (!system?.type) return null;
  const systemType = availableShipSystems.find(s => s.type === system.type);
  return (
    <div className="mb-2 w-72">
      {Object.entries(links).map(([key, value]) => {
        if (
          !["basic", "system"]
            .concat(systemType?.flags || [])
            .includes(key as any)
        )
          return null;
        return (
          <Link
            key={key}
            to={key}
            className={`list-group-item ${setting === key ? "selected" : ""}`}
          >
            {value}
          </Link>
        );
      })}
    </div>
  );
}
const links = {
  basic: "Basic",
  system: "System",
  power: "Power",
  heat: "Heat",
};
