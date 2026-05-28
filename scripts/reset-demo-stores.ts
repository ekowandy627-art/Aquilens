import {
  formatGisDemoSummary,
  resetGisDemoStores,
} from "../apps/api/src/demo/reset-gis-demo.ts";

const summary = resetGisDemoStores();
console.log(formatGisDemoSummary(summary));
