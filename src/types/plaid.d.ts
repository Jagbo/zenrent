interface PlaidLinkHandler {
  open: () => void;
  exit: () => void;
  destroy: () => void;
}

interface PlaidLinkOptions {
  token: string;
  onSuccess: (public_token: string, metadata: unknown) => void;
  onExit: () => void;
  onEvent: (eventName: string, metadata: unknown) => void;
}

interface PlaidLinkStatic {
  create: (options: PlaidLinkOptions) => PlaidLinkHandler;
}

declare global {
  interface Window {
    Plaid: PlaidLinkStatic;
  }
}
