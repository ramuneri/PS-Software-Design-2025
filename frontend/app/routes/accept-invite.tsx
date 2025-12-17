import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

type ValidateInviteResponse = {
  email: string;
  role: string;
  isValid: boolean;
  message?: string | null;
};

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<ValidateInviteResponse | null>(null);

  useEffect(() => {
    async function validateInvite() {
      if (!token) {
        setError("No invite token provided");
        setValidating(false);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/invites/validate/${token}`
        );

        if (!res.ok) {
          setError("Invalid or expired invite link");
          setValidating(false);
          return;
        }

        const data: ValidateInviteResponse = await res.json();
        setInviteInfo(data);

        if (!data.isValid) {
          setError(data.message || "This invite is no longer valid");
        } else {
          setEmail(data.email);
        }
      } catch (e: any) {
        setError("Failed to validate invite");
      } finally {
        setValidating(false);
      }
    }

    validateInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setError("No invite token provided");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/invites/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            email: email.trim(),
            password,
            name: name.trim() || null,
            surname: surname.trim() || null,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Failed to accept invite",
        }));
        throw new Error(errorData.message || "Failed to accept invite");
      }

      const result = await response.json();

      // Store user data and token if provided
      if (result.accessToken) {
        localStorage.setItem("access-token", result.accessToken);
      }
      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
      }

      // Show success message and redirect
      alert("Account created successfully! You can now log in.");
      navigate("/login", { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Failed to accept invite");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200">
        <div className="w-11/12 max-w-5xl bg-gray-300 rounded-md py-16 text-center">
          <div className="text-black">Validating invite...</div>
        </div>
      </div>
    );
  }

  if (!inviteInfo || !inviteInfo.isValid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200">
        <div className="w-11/12 max-w-5xl bg-gray-300 rounded-md py-4 text-center mb-4">
          <h1 className="text-black text-sm font-medium">Invalid Invite</h1>
        </div>

        <div className="w-11/12 max-w-5xl bg-gray-300 rounded-md flex flex-col items-center justify-center py-16">
          <div className="text-red-600 mb-4">
            {error || inviteInfo?.message || "This invite link is invalid or has expired."}
          </div>
          <button
            onClick={() => navigate("/login")}
            className="bg-gray-400 text-black font-medium py-2 px-6 rounded-md hover:bg-gray-500"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200">
      <div className="w-11/12 max-w-5xl bg-gray-300 rounded-md py-4 text-center mb-4">
        <h1 className="text-black text-sm font-medium">Accept Invite</h1>
      </div>

      <div className="w-11/12 max-w-5xl bg-gray-300 rounded-md flex flex-col items-center justify-center py-16">
        <div className="mb-4 text-center">
          <p className="text-black text-sm">
            You've been invited as <strong>{inviteInfo.role}</strong>
          </p>
          <p className="text-black text-sm mt-2">
            Email: <strong>{inviteInfo.email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-6 text-center">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-black text-left"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              readOnly
              className="w-full border border-black bg-gray-200 text-black px-2 py-2 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium text-black text-left"
            >
              Name (optional)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-black bg-white text-black px-2 py-2 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="surname"
              className="block text-xs font-medium text-black text-left"
            >
              Surname (optional)
            </label>
            <input
              type="text"
              id="surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full border border-black bg-white text-black px-2 py-2 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-black text-left"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-black bg-white text-black px-2 py-2 focus:outline-none"
            />
            <p className="text-xs text-gray-600 text-left mt-1">
              Must be at least 6 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-48 bg-gray-400 text-black font-medium py-2 rounded-md hover:bg-gray-500 disabled:bg-gray-300"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

