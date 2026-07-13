export function useStripe() {
  return {
    initPaymentSheet: async (_options: any) => {
      console.warn("Stripe is not fully supported on Web in this app yet.");
      return { error: { message: "Stripe not supported on Web yet.", code: "Unsupported" } as any };
    },
    presentPaymentSheet: async () => {
      return { error: { message: "Stripe not supported on Web yet.", code: "Unsupported" } as any };
    },
  };
}
