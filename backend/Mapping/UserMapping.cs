using backend.Data.Models;
using backend.Dtos;

namespace backend.Mapping;

public static class UserMapping
{
    public static UserListDto ToListDto(this User user)
        => new UserListDto(
            user.Id,
            user.Email ?? "",
            string.IsNullOrWhiteSpace(user.Name)
                ? (user.Email ?? "")
                : user.Name,
            user.PhoneNumber,
            user.Role,
            user.IsActive,
            user.LastLoginAt
        );
}
