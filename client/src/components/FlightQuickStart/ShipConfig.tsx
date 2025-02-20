import {q} from "@client/context/AppContext";
import Input from "@thorium/ui/Input";
import SearchableList from "@thorium/ui/SearchableList";
import * as React from "react";
import {useFlightQuickStart} from "./FlightQuickStartContext";
const ShipConfig = () => {
  const [state, dispatch] = useFlightQuickStart();

  const [pluginShips] = q.plugin.ship.available.useNetRequest();
  // Clear the shipId if the ship isn't present in the selected plugins.
  React.useEffect(() => {
    if (!pluginShips) return;
    if (
      !pluginShips?.find(
        s =>
          s.name === state.shipId?.shipId &&
          s.pluginName === state.shipId?.pluginId
      )
    ) {
      dispatch({type: "shipId", shipId: undefined});
    }
  }, [dispatch, pluginShips, state.shipId]);

  if (!pluginShips)
    return <div>No ships are present in the active plugins.</div>;

  return (
    <div>
      <Input
        placeholder="Ship Name Here"
        className="mb-4"
        label="Ship Name"
        labelHidden={false}
        value={state.shipName}
        onChange={e => dispatch({type: "shipName", name: e.target.value})}
      />
      <div className="h-64">
        <SearchableList
          selectedItem={state.shipId}
          setSelectedItem={({id}) => dispatch({type: "shipId", shipId: id})}
          items={pluginShips.map(item => ({
            id: {shipId: item.name, pluginId: item.pluginName},
            label: item.name,
            description: item.description,
            category: item.pluginName,
            image: item.vanityUrl,
          }))}
          renderItem={item => (
            <div>
              <img
                src={item.image}
                alt={item.label}
                className="float-left h-12 w-12 mr-2 bg-black/80 rounded-full"
              />
              <p className="font-bold">{item.label}</p>
              <p>{item.description}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default ShipConfig;
