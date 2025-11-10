
export async function apiFetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access-token");

    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
    });
    
    if (res.status === 401) {
        const refreshResult = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });

        if (refreshResult.ok) {
            const data = await refreshResult.json();
            localStorage.setItem("access-token", data.accessToken);
            
            return fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {}),
                    Authorization: `Bearer ${data.accessToken}`,
                },
                credentials: "include",
            });
        } else {
            localStorage.removeItem("access-token");
            window.location.href = "/login";
            return res;
        }
    }

    return res;
}
