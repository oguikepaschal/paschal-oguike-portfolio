// Runs the weave layout off the main thread (it takes ~100ms+ on desktop,
// several times that on a slow CPU). Receives a format, returns the marks.
import snapshot from "@/src/data/weave-commits.json";
import { layout, normalize, type WeaveFormat } from "@/lib/weave";

const commits = normalize(snapshot);

self.onmessage = (e: MessageEvent<{ id: number; format: WeaveFormat }>) => {
  const { id, format } = e.data;
  self.postMessage({ id, marks: layout(commits, format) });
};
