import { useNavigate } from "react-router-dom";

export default function CreateUserPage() {
  const navigate = useNavigate();

  return (
    <div
      className="bg-gray-200 flex flex-col text-black"
      style={{ height: "calc(100vh - 52px)" }}
    >
      <div className="p-6 flex-1 flex flex-col overflow-hidden space-y-6">
        <div className="bg-gray-300 rounded-md py-3 text-center font-medium">
          Create User
        </div>

        <div className="bg-gray-300 rounded-md p-6 space-y-4">
          <p className="text-gray-800">
            Users are created via invites. Go to the User List and use{" "}
            <span className="font-medium">Add User</span> to generate an invite
            link.
          </p>

          <div className="flex justify-end">
            <button
              onClick={() => navigate("/users")}
              className="bg-gray-200 hover:bg-gray-400 rounded-md px-4 py-2 font-medium"
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
