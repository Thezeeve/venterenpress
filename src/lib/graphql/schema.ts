import { createSchema } from "graphql-yoga";
import { prisma } from "@/lib/prisma";

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Category {
      id: ID!
      name: String!
      slug: String!
    }

    type Article {
      id: ID!
      title: String!
      slug: String!
      excerpt: String
      status: String!
      featuredImageUrl: String
      publishedAt: String
    }

    type DashboardMetric {
      label: String!
      value: String!
      delta: String!
    }

    type Query {
      articles(limit: Int = 10): [Article!]!
      categories: [Category!]!
      dashboardMetrics: [DashboardMetric!]!
    }
  `,
  resolvers: {
    Query: {
      articles: async (_parent, args) => {
        return prisma.article.findMany({
          take: args.limit,
          orderBy: { updatedAt: "desc" },
        });
      },
      categories: async () => prisma.category.findMany({ orderBy: { name: "asc" } }),
      dashboardMetrics: async () => [
        { label: "Monthly Readers", value: "34.8M", delta: "+12.4%" },
        { label: "Stories Published", value: "4,280", delta: "+8.1%" },
        { label: "Subscriber Growth", value: "18.3%", delta: "+3.9%" },
      ],
    },
  },
});
