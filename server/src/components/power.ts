import {MegaWatt} from "@server/utils/unitTypes";
import {Component} from "./utils";

export class PowerComponent extends Component {
  static id = "power" as const;

  /** The minimum amount of power required to make this system operate */
  requiredPower: MegaWatt = 5;

  /** The normal amount of power this system will request  */
  defaultPower: MegaWatt = 10;

  /** The threshold of power usage for safely using this system */
  maxSafePower: MegaWatt = 20;

  /** The current power provided to this system, calculated every frame */
  currentPower: MegaWatt = 10;

  /** How much power the system is currently drawing, calculated every frame */
  powerDraw: MegaWatt = 0;

  /** How much power is currently being requested. Could be more than the maxSafePower */
  requestedPower: MegaWatt = 10;
}