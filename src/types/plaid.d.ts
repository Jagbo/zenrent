interface PlaidLinkHandler {
  open: () => void;
  exit: () => void;
  destroy: () => void;
}

interface PlaidLinkOptions {
  token: string;
  onSuccess: (public_token: string, metadata: any) => void;
  onExit: () => void;
  onEvent: (eventName: string, metadata: any) => void;
}

interface PlaidLinkStatic {
  create: (options: PlaidLinkOptions) => PlaidLinkHandler;
}

declare global {
  interface Window {
    Plaid: PlaidLinkStatic;
  }
} 