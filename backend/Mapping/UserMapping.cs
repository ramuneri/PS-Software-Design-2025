using backend.Data.Models;
using backend.Dtos;

namespace backend.Mapping;

public static class UserMapping
{
    public static UserListDto ToListDto(this User user)
    => new(
        user.Id,
        user.Email!,
        (
            string.IsNullOrWhiteSpace(user.Name)
                ? user.Email
                : $"{user.Name ?? ""} {user.Surname ?? ""}".Trim()
        )!
    );
}
