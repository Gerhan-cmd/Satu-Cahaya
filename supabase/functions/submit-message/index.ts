import { createDeps } from '../_shared/deps.ts';
import { handleSubmit } from '../_shared/handlers.ts';

const deps = createDeps();
Deno.serve((req) => handleSubmit(req, deps));
