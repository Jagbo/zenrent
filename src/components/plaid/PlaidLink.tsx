"use client";

import React, { useCallback } from "react";
import {
  usePlaidLink,
  PlaidLinkOptionsWithLinkToken,
  PlaidLinkOnSuccess,
  PlaidLinkOnExit,
  PlaidLinkOnEvent,
} from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PlaidLinkProps {
  linkToken: string;
  onSuccess: PlaidLinkOnSuccess;
  onExit?: () => void;
  onOpen?: () => void;
}

export function PlaidLink({
  linkToken,
  onSuccess,
  onExit,
  onOpen,
}: PlaidLinkProps) {
  const config: PlaidLinkOptionsWithLinkToken = {
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      console.log("Link success:", metadata);
      onSuccess(public_token, metadata);
    },
    onExit: (err, metadata) => {
      console.log("Link exit:", err, metadata);
      if (err) {
        console.error("Link error:", err);
      }
      if (onExit) onExit();
    },
    onEvent: (eventName, metadata) => {
      console.log("Plaid Link event:", eventName, metadata);
      if (eventName === "OPEN" && onOpen) {
        onOpen();
      }
      if (eventName === "READY") {
        console.log("Plaid Link ready");
      }
      if (eventName === "ERROR") {
        console.error("Plaid Link error:", metadata);
      }
    },
  };

  const { open, ready, error } = usePlaidLink(config);

  if (error) {
    console.error("usePlaidLink error:", error);
  }

  const handleClick = useCallback(() => {
    if (ready) {
      console.log("Opening Plaid Link...");
      if (onOpen) onOpen();
      open();
    } else {
      console.warn("Plaid Link not ready");
    }
  }, [ready, open, onOpen]);

  return (
    <Button onClick={handleClick} disabled={!ready}>
      Connect Bank
    </Button>
  );
}
