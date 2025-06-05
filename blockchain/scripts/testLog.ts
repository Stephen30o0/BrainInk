async function main() {
  console.log("--- testLog.ts executed successfully ---");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
