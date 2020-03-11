import { EventEmitter } from "events";

import Dispatcher from "../dispatcher";


class SongStore extends EventEmitter {
  constructor() {
    super()
    this.smallStats = [
      {
        label: "Songs",
        value: "2,391",
        percentage: "4.7%",
        increase: true,
        chartLabels: [null, null, null, null, null, null, null],
        attrs: { md: "6", sm: "6" },
        datasets: [
          {
            label: "Today",
            fill: "start",
            borderWidth: 1.5,
            backgroundColor: "rgba(0, 184, 216, 0.1)",
            borderColor: "rgb(0, 184, 216)",
            data: [1, 2, 1, 3, 5, 4, 7]
          }
        ]
      }
    ]
  }

  getAll() {
    return this.smallStats;
  }
}

const songStore = new SongStore();
//songStore.on("change", someHandler)
export default songStore
