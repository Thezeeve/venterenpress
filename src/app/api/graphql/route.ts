import { createYoga } from "graphql-yoga";
import { schema } from "@/lib/graphql/schema";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
});

async function handler(request: Request) {
  return yoga.handleRequest(request, {});
}

export { handler as GET, handler as POST };
