import { XMarkIcon } from "@heroicons/react/24/solid";
import React, { ReactNode } from "react";

interface BaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "full";
  blurIntensity?: "none" | "sm" | "md" | "lg";
  overlayOpacity?: "light" | "medium" | "dark";
}

export const BaseDrawer: React.FC<BaseDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = "md",
  blurIntensity = "md",
  overlayOpacity = "light",
}) => {
  if (!isOpen) return null;

  const getWidthClass = () => {
    switch (width) {
      case "sm":
        return "max-w-sm";
      case "md":
        return "max-w-md";
      case "lg":
        return "max-w-lg";
      case "xl":
        return "max-w-xl";
      case "full":
        return "max-w-full";
      default:
        return "max-w-md";
    }
  };

  const getBlurClass = () => {
    switch (blurIntensity) {
      case "none":
        return "";
      case "sm":
        return "backdrop-blur-sm";
      case "md":
        return "backdrop-blur-md backdrop-filter";
      case "lg":
        return "backdrop-blur-lg backdrop-filter";
      default:
        return "backdrop-blur-md backdrop-filter";
    }
  };

  const getOpacityClass = () => {
    switch (overlayOpacity) {
      case "light":
        return "bg-white/10";
      case "medium":
        return "bg-white/20";
      case "dark":
        return "bg-black/20";
      default:
        return "bg-white/10";
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className={`fixed inset-0 w-full h-full ${getOpacityClass()} ${getBlurClass()} transition-opacity z-40`}
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 z-50">
          <div className={`pointer-events-auto w-screen ${getWidthClass()}`}>
            <div className="flex h-full flex-col bg-white !bg-white shadow-xl">
              <div className="px-4 pt-5 pb-4 sm:px-6 border-b border-gray-200 bg-white !bg-white">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                  <button type="button"
                    className="ml-3 flex h-7 w-7 items-center justify-center rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-6 bg-white !bg-white">
                <div className="px-4 sm:px-6 bg-white !bg-white">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
