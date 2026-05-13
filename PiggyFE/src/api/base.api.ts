import axios from "axios";
import { toast } from "react-toastify";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_BASE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Flag để kiểm tra đang refresh token hay không
let isRefreshing = false;

// Định nghĩa interface cho queue item
interface QueueItem {
    resolve: (value: string | PromiseLike<string>) => void;
    reject: (reason?: any) => void;
}

// Queue chứa các request đang chờ refresh token
let failedQueue: QueueItem[] = [];

// Hàm xử lý các request trong queue
const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token as string);
        }
    });
    failedQueue = [];
};

// Hàm refresh token
const refreshToken = async () => {
    try {
        const refreshTokenStr = localStorage.getItem("refreshToken");
        if (!refreshTokenStr) {
            throw new Error("No refresh token available");
        }

        const response = await axios.post(
            `${import.meta.env.VITE_BASE_API_URL}/api/auth/refresh-token`,
            { refreshToken: refreshTokenStr }
        );

        // PiggyBE trả về wrapper ResponseModel: { code, message, data: { accessToken, refreshToken } }
        const { accessToken, refreshToken: newRefreshTokenStr } = response.data.data;

        // Lưu lại token mới
        localStorage.setItem("token", accessToken);
        if (newRefreshTokenStr) {
            localStorage.setItem("refreshToken", newRefreshTokenStr);
        }

        return accessToken;
    } catch (error) {
        // Nếu refresh token cũng hết hạn, logout user
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        throw error;
    }
};

// Interceptor cho request
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // Dành cho API Gateway xử lý JWT
        }

        // Dự phòng trường hợp bypass API Gateway gọi thẳng Microservices khi Dev
        const userId = localStorage.getItem("userId");
        if (userId && !config.headers["X-User-Id"]) {
            config.headers["X-User-Id"] = userId;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 500 || error.response?.status === 501) {
            if (error.response?.data?.message) {
                toast.error("Đã có lỗi xảy ra từ máy chủ. Vui lòng thử lại sau.");
                console.error(error.response.data.message);
            }
            return Promise.reject(error);
        }

        // Xử lý lỗi 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await refreshToken();
                isRefreshing = false;
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axiosClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                return Promise.reject(refreshError);
            }
        }

        // Only show generic toast for server errors; let 4xx bubble to the caller
        if (error.response?.status && error.response.status >= 500) {
            toast.error(error.response?.data?.message || 'Đã có lỗi xảy ra từ máy chủ. Vui lòng thử lại sau.');
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
