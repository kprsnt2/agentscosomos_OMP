import { runEpoch } from "./cycle";

async function main() {
  console.log("Starting manual epoch cycle...\n");
  const { epoch, log } = await runEpoch();
  console.log(log.join("\n"));
  console.log(`\nEpoch ${epoch} finished.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Cycle failed:", err);
  process.exit(1);
});
