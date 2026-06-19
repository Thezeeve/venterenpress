import { randomUUID } from "crypto";
import { PaymentProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CheckoutInput = {
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
};

export interface PaymentGateway {
  provider: PaymentProvider;
  createCheckoutSession(input: CheckoutInput): Promise<{
    checkoutUrl: string;
    providerReference: string;
  }>;
}

class MockPaymentGateway implements PaymentGateway {
  provider = PaymentProvider.MOCK;

  async createCheckoutSession(input: CheckoutInput) {
    const transaction = await prisma.paymentTransaction.create({
      data: {
        userId: input.userId,
        planId: input.planId,
        provider: PaymentProvider.MOCK,
        providerReference: `mock_${randomUUID()}`,
        amount: 0,
        status: "PENDING",
        metadata: {
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        },
      },
    });

    return {
      checkoutUrl: `${input.successUrl}?mockCheckout=${transaction.id}`,
      providerReference: transaction.providerReference ?? transaction.id,
    };
  }
}

export function getPaymentGateway(provider = process.env.PAYMENT_PROVIDER ?? "MOCK") {
  switch (provider) {
    case "STRIPE":
      return new MockPaymentGateway();
    default:
      return new MockPaymentGateway();
  }
}
