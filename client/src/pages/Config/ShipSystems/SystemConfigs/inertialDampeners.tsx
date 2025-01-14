import {Navigate, useParams} from "react-router-dom";
import Input from "@thorium/ui/Input";
import {AllShipSystems} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {toast} from "client/src/context/ToastContext";
import {useContext, useReducer} from "react";
import {ShipPluginIdContext} from "../../Ships/ShipSystemOverrideContext";
import {OverrideResetButton} from "../OverrideResetButton";
import {q} from "@client/context/AppContext";
export default function InertialDampenersConfig() {
  const {pluginId, systemId, shipId} = useParams() as {
    pluginId: string;
    systemId: string;
    shipId: string;
  };
  const shipPluginId = useContext(ShipPluginIdContext);

  const [system] = q.plugin.systems.inertialDampeners.get.useNetRequest({
    pluginId,
    systemId,
    shipId,
    shipPluginId,
  });
  const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());
  const key = `${systemId}${rekey}`;
  if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

  return (
    <fieldset key={key} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-2 flex">
            <Input
              labelHidden={false}
              inputMode="numeric"
              pattern="[0-9]*"
              label="Dampening"
              placeholder={"1"}
              helperText={
                "Number > 0 that affects how fast the ship slows. Lower numbers slow the ship faster."
              }
              defaultValue={system.dampening}
              onBlur={async e => {
                if (!e.target.value || isNaN(Number(e.target.value))) return;
                try {
                  await q.plugin.systems.inertialDampeners.update.netSend({
                    pluginId,
                    systemId: systemId,
                    shipId,
                    shipPluginId,
                    dampening: Number(e.target.value),
                  });
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error changing dampening",
                      body: err.message,
                      color: "error",
                    });
                  }
                }
              }}
            />
            <OverrideResetButton
              property="dampening"
              setRekey={setRekey}
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
