import {createMockDataContext} from "server/src/utils/createMockDataContext";
import {flightInputs} from "../flight";
import {solarSystemsPluginInputs} from "../plugins/universe/solarSystems";
import {starPluginInputs} from "../plugins/universe/stars";
import {planetPluginInputs} from "../plugins/universe/planets";

describe("flight input", () => {
  it("should start a flight", async () => {
    const mockDataContext = createMockDataContext();
    mockDataContext.database.flight = null;

    expect(mockDataContext.flight).toBeNull();

    const flight = await flightInputs.flightStart(mockDataContext, {
      flightName: "Test Flight",
      ships: [
        {
          shipName: "Test Ship",
          shipTemplate: {pluginId: "Test Plugin", shipId: "Test Template"},
          crewCount: 1,
        },
      ],
    });
    expect(mockDataContext.flight).toBeDefined();
    if (!mockDataContext.flight) throw new Error("No flight created");
    expect(mockDataContext.flight.name).toEqual("Test Flight");
    expect(mockDataContext.flight.ships.length).toEqual(1);
    expect(mockDataContext.flight.ships[0].components.identity?.name).toEqual(
      "Test Ship"
    );
  });
  it("should correctly spawn star map objects", async () => {
    const mockDataContext = createMockDataContext();
    mockDataContext.database.flight = null;

    // Create some star map object plugins
    const solarSystem = solarSystemsPluginInputs.pluginSolarSystemCreate(
      mockDataContext,
      {
        pluginId: "Test Plugin",
        position: {x: 1, y: 2, z: 3},
      }
    );
    const star = starPluginInputs.pluginStarCreate(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: solarSystem.solarSystemId,
      spectralType: "G",
    });
    const planet = planetPluginInputs.pluginPlanetCreate(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: solarSystem.solarSystemId,
      planetType: "M",
    });

    // Start a flight
    const flight = await flightInputs.flightStart(mockDataContext, {
      flightName: "Test Flight",
      ships: [
        {
          shipName: "Test Ship",
          shipTemplate: {pluginId: "Test Plugin", shipId: "Test Template"},
          crewCount: 1,
        },
      ],
    });
    expect(mockDataContext.flight).toBeDefined();
    if (!mockDataContext.flight) throw new Error("No flight created");

    // Check that the flight has the correct number of objects
    const systemEntity = mockDataContext.flight.ecs.entities.find(
      entity => entity.components.isSolarSystem
    );
    expect(systemEntity).toBeDefined();
    expect(systemEntity?.components.identity?.name).toEqual(
      solarSystem.solarSystemId
    );
    const {x, y, z} = systemEntity?.components.position || {};
    expect({x, y, z}).toMatchInlineSnapshot(`
      Object {
        "x": 1,
        "y": 2,
        "z": 3,
      }
    `);
    const starEntity = mockDataContext.flight.ecs.entities.find(
      entity => entity.components.isStar
    );
    expect(starEntity).toBeDefined();
    expect(starEntity?.components.identity?.name).toEqual(star.name);
    const planetEntity = mockDataContext.flight.ecs.entities.find(
      entity => entity.components.isPlanet
    );
    expect(planetEntity).toBeDefined();
    expect(planetEntity?.components.identity?.name).toEqual(planet.name);
  });
  it("should properly position the player ship in sandbox mode", async () => {
    const mockDataContext = createMockDataContext();
    mockDataContext.database.flight = null;

    // Create some star map object plugins
    const solarSystem = solarSystemsPluginInputs.pluginSolarSystemCreate(
      mockDataContext,
      {
        pluginId: "Test Plugin",
        position: {x: 1, y: 2, z: 3},
      }
    );
    const star = starPluginInputs.pluginStarCreate(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: solarSystem.solarSystemId,
      spectralType: "G",
    });
    const planet = planetPluginInputs.pluginPlanetCreate(mockDataContext, {
      pluginId: "Test Plugin",
      solarSystemId: solarSystem.solarSystemId,
      planetType: "M",
    });

    const flight = await flightInputs.flightStart(mockDataContext, {
      flightName: "Test Flight",
      ships: [
        {
          shipName: "Test Ship",
          shipTemplate: {pluginId: "Test Plugin", shipId: "Test Template"},
          crewCount: 1,
          startingPoint: {
            pluginId: "Test Plugin",
            type: "planet",
            solarSystemId: solarSystem.solarSystemId,
            objectId: planet.name,
          },
        },
      ],
    });
    expect(mockDataContext.flight).toBeDefined();
    if (!mockDataContext.flight) throw new Error("No flight created");

    expect(flight.playerShips[0].components.position).toMatchInlineSnapshot(`
      PositionComponent {
        "parentId": 50000,
        "type": "solar",
        "x": 405653673.54815173,
        "y": 0,
        "z": -175748537.63086534,
      }
    `);
  });
});
