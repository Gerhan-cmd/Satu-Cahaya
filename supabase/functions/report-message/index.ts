import { createDeps } from '../_shared/deps.ts';
import { handleReport } from '../_shared/handlers.ts';

const deps = createDeps();
Deno.serve((req) => handleReport(req, deps));
