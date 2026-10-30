// Run once outside Vercel; build a reusable image before accepting code jobs.
import { ModalClient } from "modal";

const client = new ModalClient({
  environment: process.env.PREP_MODAL_ENVIRONMENT || "main",
});
try {
  const app = await client.apps.fromName(process.env.PREP_MODAL_APP || "prep", {
    createIfMissing: true,
  });
  const image = await client.images
    .fromRegistry("python:3.12-slim-bookworm")
    .dockerfileCommands([
      "RUN apt-get update && apt-get install -y --no-install-recommends g++ coreutils && rm -rf /var/lib/apt/lists/*",
      "RUN python -m venv /opt/prep/runtime && /opt/prep/runtime/bin/pip install --no-cache-dir pytest==8.4.2",
      "RUN useradd --create-home --uid 1000 prep && mkdir /work && chown prep:prep /work",
      "USER prep",
      "WORKDIR /work",
    ])
    .build(app);
  console.log(`PREP_MODAL_IMAGE_ID=${image.imageId}`);
  console.log(
    "Image built. Add this ID and Modal API credentials to Development/Preview; set PREP_EXECUTION_PROVIDER=modal to opt in.",
  );
} finally {
  client.close();
}
