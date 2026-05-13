import { toast } from "react-toastify";
import type { ToastOptions } from "react-toastify";

interface ToastifyOptions extends ToastOptions {
    position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
}

const defaultOptions: ToastifyOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
};

export const useToastify = () => {
    const success = (message: string, options?: ToastifyOptions) => {
        toast.success(message, { ...defaultOptions, ...options });
    };

    const error = (message: string, options?: ToastifyOptions) => {
        toast.error(message, { ...defaultOptions, ...options });
    };

    const info = (message: string, options?: ToastifyOptions) => {
        toast.info(message, { ...defaultOptions, ...options });
    };

    const warning = (message: string, options?: ToastifyOptions) => {
        toast.warning(message, { ...defaultOptions, ...options });
    };

    return {
        success,
        error,
        info,
        warning,
    };
};
